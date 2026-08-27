<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\MarketingCampaign;
use App\Models\MarketingCampaignRecipient;
use App\Services\Marketing\MarketingCampaignDispatcher;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use RuntimeException;
use SimpleXMLElement;

class MarketingRecipientImportController extends Controller
{
    public function store(Request $request, MarketingCampaign $campaign, MarketingCampaignDispatcher $dispatcher): RedirectResponse
    {
        abort_if($campaign->status === 'running', 422, 'کمپین در حال اجراست؛ تا پایان اجرا امکان ورود فایل جدید وجود ندارد.');

        abort_if($campaign->channel === 'in_app', 422, 'ورود Excel برای کمپین‌های پیامکی و ایمیلی است؛ اعلان داخل پنل به شناسه کاربر نیاز دارد.');

        $validated = $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:csv,txt,xlsx'],
            'replace' => ['sometimes', 'boolean'],
            'start_campaign' => ['sometimes', 'boolean'],
        ]);

        try {
            $rows = $this->readRows($validated['file']);
        } catch (RuntimeException $exception) {
            return back()->withErrors(['file' => $exception->getMessage()]);
        }

        if ($rows === []) {
            return back()->withErrors(['file' => 'فایل شما ردیف مخاطب قابل استفاده‌ای ندارد.']);
        }

        $valid = [];
        $skipped = 0;
        foreach ($rows as $row) {
            $phone = $this->normalizePhone($row['phone'] ?? '');
            $email = trim((string) ($row['email'] ?? ''));
            $validEmail = $email !== '' && filter_var($email, FILTER_VALIDATE_EMAIL);
            if (($campaign->channel === 'sms' && $phone === null) || ($campaign->channel === 'email' && ! $validEmail)) {
                $skipped++;
                continue;
            }
            if ($phone === null && ! $validEmail) {
                $skipped++;
                continue;
            }
            $valid[] = [
                'name' => Str::limit(trim((string) ($row['name'] ?? 'مخاطب کمپین')) ?: 'مخاطب کمپین', 255, ''),
                'phone' => $phone,
                'email' => $validEmail ? Str::limit($email, 255, '') : null,
                'status' => 'queued',
                'error' => null,
                'sent_at' => null,
            ];
        }

        $valid = collect($valid)->unique(fn (array $row) => $row['phone'] ?: 'email:'.$row['email'])->values()->all();
        if ($valid === []) {
            return back()->withErrors(['file' => 'هیچ شماره موبایل یا ایمیل معتبر و قابل ارسال در فایل پیدا نشد.']);
        }

        $start = $request->boolean('start_campaign', true);
        DB::transaction(function () use ($campaign, $valid, $request, $start): void {
            if ($request->boolean('replace', true)) {
                $campaign->recipients()->delete();
            }
            foreach (array_chunk($valid, 500) as $chunk) {
                $campaign->recipients()->createMany($chunk);
            }
            $campaign->update([
                'audience' => 'imported',
                'status' => $start ? 'active' : 'draft',
                'total_recipients' => count($valid),
                'sent_count' => 0,
                'failed_count' => 0,
            ]);
        });

        if ($start) {
            $dispatcher->queue($campaign->fresh());
        }

        $message = count($valid).' مخاطب با موفقیت وارد شد.'.($skipped > 0 ? " {$skipped} ردیف نامعتبر نادیده گرفته شد." : '');
        $message .= $start ? ' اجرای کمپین در صف قرار گرفت.' : ' کمپین به‌صورت پیش‌نویس ذخیره شد.';

        return back()->with('success', $message);
    }

    /** @return array<int, array{phone?: string, name?: string, email?: string}> */
    private function readRows(UploadedFile $file): array
    {
        $extension = strtolower($file->getClientOriginalExtension());
        return match ($extension) {
            'csv', 'txt' => $this->readCsv($file->getRealPath()),
            'xlsx' => $this->readXlsx($file->getRealPath()),
            default => throw new RuntimeException('فرمت فایل پشتیبانی نمی‌شود. فقط CSV یا XLSX ارسال کنید.'),
        };
    }

    /** @return array<int, array<string, string>> */
    private function readCsv(string $path): array
    {
        $handle = fopen($path, 'rb');
        if ($handle === false) {
            throw new RuntimeException('فایل قابل خواندن نیست.');
        }
        $firstLine = fgets($handle) ?: '';
        $delimiter = substr_count($firstLine, ';') > substr_count($firstLine, ',') ? ';' : ',';
        rewind($handle);
        $headers = fgetcsv($handle, 0, $delimiter);
        if ($headers === false) {
            fclose($handle);
            throw new RuntimeException('سطر عنوان ستون‌ها در فایل پیدا نشد.');
        }
        $map = $this->headerMap($headers);
        if (! isset($map['phone']) && ! isset($map['email'])) {
            fclose($handle);
            throw new RuntimeException('فایل باید حداقل یکی از ستون‌های موبایل یا ایمیل را داشته باشد.');
        }

        $rows = [];
        while (($values = fgetcsv($handle, 0, $delimiter)) !== false) {
            if (count($rows) >= 10000) {
                fclose($handle);
                throw new RuntimeException('حداکثر ۱۰٬۰۰۰ ردیف در هر فایل قابل ورود است.');
            }
            $row = [];
            foreach ($map as $key => $index) {
                $row[$key] = trim((string) ($values[$index] ?? ''));
            }
            $rows[] = $row;
        }
        fclose($handle);
        return $rows;
    }

    /** @return array<int, array<string, string>> */
    private function readXlsx(string $path): array
    {
        if (! class_exists('ZipArchive') || ! function_exists('simplexml_load_string')) {
            throw new RuntimeException('برای خواندن XLSX، افزونه‌های ZIP و SimpleXML PHP باید روی سرور فعال باشند.');
        }
        $zip = new \ZipArchive();
        if ($zip->open($path) !== true) {
            throw new RuntimeException('فایل XLSX معتبر نیست یا باز نمی‌شود.');
        }
        $sheetXml = $zip->getFromName('xl/worksheets/sheet1.xml');
        if ($sheetXml === false) {
            $zip->close();
            throw new RuntimeException('برگه اول فایل XLSX پیدا نشد.');
        }
        if (strlen($sheetXml) > 20 * 1024 * 1024) {
            $zip->close();
            throw new RuntimeException('حجم محتوای XLSX بیش از حد مجاز است.');
        }
        $shared = [];
        $sharedXml = $zip->getFromName('xl/sharedStrings.xml');
        if ($sharedXml !== false) {
            $sharedRoot = simplexml_load_string($sharedXml, SimpleXMLElement::class, LIBXML_NONET | LIBXML_NOCDATA);
            foreach ($sharedRoot?->si ?? [] as $item) {
                $parts = $item->xpath('.//*[local-name()="t"]') ?: [];
                $shared[] = implode('', array_map(static fn ($part): string => (string) $part, $parts));
            }
        }
        $sheet = simplexml_load_string($sheetXml, SimpleXMLElement::class, LIBXML_NONET | LIBXML_NOCDATA);
        $zip->close();
        if (! $sheet) {
            throw new RuntimeException('ساختار فایل XLSX قابل پردازش نیست.');
        }

        $rows = [];
        $namespace = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
        $sheetData = $sheet->children($namespace)->sheetData;
        foreach ($sheetData->row ?? [] as $xmlRow) {
            if (count($rows) >= 10001) {
                throw new RuntimeException('حداکثر ۱۰٬۰۰۰ ردیف در هر فایل قابل ورود است.');
            }
            $row = [];
            foreach ($xmlRow->children($namespace)->c ?? [] as $cell) {
                // SimpleXML can lose unqualified attributes when the cell is
                // reached through a namespace-specific child iterator, so read
                // them explicitly and keep the actual column position. This
                // also preserves empty cells between the headers and values.
                $attributes = $cell->attributes();
                $ref = (string) ($attributes['r'] ?? '');
                $column = preg_replace('/\d+/', '', $ref) ?: '';
                $columnIndex = $this->xlsxColumnIndex($column);
                $cellData = $cell->children($namespace);
                $value = (string) ($cellData->v ?? '');
                $type = (string) ($attributes['t'] ?? '');
                if ($type === 's') {
                    $value = $shared[(int) $value] ?? '';
                } elseif ($type === 'inlineStr') {
                    $parts = $cellData->is->xpath('.//*[local-name()="t"]') ?: [];
                    $value = implode('', array_map(static fn ($part): string => (string) $part, $parts));
                }
                $row[$columnIndex] = trim($value);
            }
            if ($row !== []) {
                ksort($row);
                $rows[] = $row;
            }
        }
        if ($rows === []) {
            throw new RuntimeException('فایل XLSX خالی است.');
        }

        $headers = array_values($rows[0]);
        $map = $this->headerMap($headers);
        if (! isset($map['phone']) && ! isset($map['email'])) {
            throw new RuntimeException('فایل باید حداقل یکی از ستون‌های موبایل یا ایمیل را داشته باشد.');
        }
        $result = [];
        foreach (array_slice($rows, 1) as $values) {
            $ordered = array_values($values);
            $result[] = collect($map)->mapWithKeys(fn ($index, $key) => [$key => trim((string) ($ordered[$index] ?? ''))])->all();
        }
        return $result;
    }

    private function xlsxColumnIndex(string $column): int
    {
        $index = 0;
        foreach (str_split(strtoupper($column)) as $letter) {
            $index = ($index * 26) + (ord($letter) - 64);
        }
        return max(0, $index - 1);
    }

    /** @param array<int, mixed> $headers @return array<string, int> */
    private function headerMap(array $headers): array
    {
        $map = [];
        foreach ($headers as $index => $header) {
            $value = mb_strtolower(trim(str_replace(["\xEF\xBB\xBF", '_', '-'], ['', ' ', ' '], (string) $header)));
            if (in_array($value, ['phone', 'mobile', 'mobile number', 'telephone', 'موبایل', 'شماره موبایل', 'شماره تماس', 'تلفن'], true)) $map['phone'] = $index;
            if (in_array($value, ['name', 'full name', 'نام', 'نام و نام خانوادگی', 'نام خانوادگی'], true)) $map['name'] = $index;
            if (in_array($value, ['email', 'email address', 'ایمیل', 'پست الکترونیک'], true)) $map['email'] = $index;
        }
        return $map;
    }

    private function normalizePhone(string $phone): ?string
    {
        $phone = strtr(trim($phone), ['۰' => '0', '۱' => '1', '۲' => '2', '۳' => '3', '۴' => '4', '۵' => '5', '۶' => '6', '۷' => '7', '۸' => '8', '۹' => '9']);
        $phone = preg_replace('/\D+/', '', $phone) ?: '';
        if (str_starts_with($phone, '98')) $phone = '0'.substr($phone, 2);
        if (strlen($phone) === 10 && str_starts_with($phone, '9')) $phone = '0'.$phone;
        return preg_match('/^09\d{9}$/', $phone) ? $phone : null;
    }
}
