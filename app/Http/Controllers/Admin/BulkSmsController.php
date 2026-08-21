<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\BulkSmsRun;
use App\Models\Setting;
use App\Services\Sms\SmsSender;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;
use RuntimeException;
use SimpleXMLElement;

class BulkSmsController extends Controller
{
    public function index(): Response
    {
        return Inertia::render('Admin/Marketing/BulkSms', [
            'smsEnabled' => Setting::get('sms_enabled', false),
            'stats' => [
                'totalSent' => (int) DB::table('marketing_campaign_recipients')
                    ->where('status', 'sent')
                    ->where('channel', 'sms')
                    ->count(),
            ],
        ]);
    }

    public function preview(Request $request): Response
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:csv,txt,xlsx'],
        ]);

        try {
            $rows = $this->readRows($validated['file']);
        } catch (RuntimeException $exception) {
            return back()->withErrors(['file' => $exception->getMessage()]);
        }

        $valid = [];
        $skipped = 0;
        foreach ($rows as $row) {
            $phone = $this->normalizePhone($row['phone'] ?? '');
            if ($phone === null) {
                $skipped++;
                continue;
            }
            $valid[] = [
                'name' => Str::limit(trim((string) ($row['name'] ?? '')) ?: 'مخاطب', 255, ''),
                'phone' => $phone,
            ];
        }

        $valid = collect($valid)->unique('phone')->values()->all();

        return Inertia::render('Admin/Marketing/BulkSms', [
            'smsEnabled' => Setting::get('sms_enabled', false),
            'preview' => [
                'contacts' => array_slice($valid, 0, 10),
                'total' => count($valid),
                'skipped' => $skipped,
            ],
            'stats' => [
                'totalSent' => (int) DB::table('marketing_campaign_recipients')
                    ->where('status', 'sent')
                    ->where('channel', 'sms')
                    ->count(),
            ],
        ]);
    }

    public function send(Request $request, SmsSender $smsSender): RedirectResponse
    {
        $validated = $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:csv,txt,xlsx'],
            'message' => ['required', 'string', 'max:500'],
        ]);

        try {
            $rows = $this->readRows($validated['file']);
        } catch (RuntimeException $exception) {
            return back()->withErrors(['file' => $exception->getMessage()]);
        }

        $valid = [];
        foreach ($rows as $row) {
            $phone = $this->normalizePhone($row['phone'] ?? '');
            if ($phone === null) {
                continue;
            }
            $valid[] = [
                'name' => Str::limit(trim((string) ($row['name'] ?? '')) ?: 'مخاطب', 255, ''),
                'phone' => $phone,
            ];
        }

        $valid = collect($valid)->unique('phone')->values()->all();

        if ($valid === []) {
            return back()->withErrors(['file' => 'هیچ شماره موبایل معتبری در فایل پیدا نشد.']);
        }

        $sentCount = 0;
        $failedCount = 0;
        $template = $validated['message'];
        $run = BulkSmsRun::create([
            'message' => $template,
            'status' => 'running',
            'recipients_count' => count($valid),
            'sent_count' => 0,
            'failed_count' => 0,
            'started_at' => now(),
        ]);
        $run->recipients()->createMany(array_map(fn (array $contact) => [
            'name' => $contact['name'],
            'phone' => $contact['phone'],
            'status' => 'queued',
        ], $valid));

        foreach ($valid as $contact) {
            $message = str_replace(
                ['{name}', '{phone}'],
                [$contact['name'], $contact['phone']],
                $template
            );
            try {
                $smsSender->send($contact['phone'], $message);
                $run->recipients()->where('phone', $contact['phone'])->update(['status' => 'sent', 'sent_at' => now(), 'error' => null]);
                $sentCount++;
            } catch (\Throwable $exception) {
                $run->recipients()->where('phone', $contact['phone'])->update(['status' => 'failed', 'error' => Str::limit($exception->getMessage(), 1000, '')]);
                $failedCount++;
                Log::warning('Bulk SMS recipient failed', [
                    'run_id' => $run->id,
                    'phone' => $contact['phone'],
                    'error' => $exception->getMessage(),
                ]);
            }
        }

        $run->update([
            'status' => 'completed',
            'sent_count' => $sentCount,
            'failed_count' => $failedCount,
            'completed_at' => now(),
        ]);

        return back()->with('success', "ارسال پیامک انجام شد. {$sentCount} پیامک ارسال شد" . ($failedCount > 0 ? " و {$failedCount} مورد ناموفق بود." : '.'));
    }

    /** @return array<int, array{phone?: string, name?: string}> */
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
        if (! isset($map['phone'])) {
            fclose($handle);
            throw new RuntimeException('فایل باید حداقل ستون موبایل داشته باشد.');
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
        if (! isset($map['phone'])) {
            throw new RuntimeException('فایل باید حداقل ستون موبایل داشته باشد.');
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
