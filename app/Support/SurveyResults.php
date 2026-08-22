<?php

namespace App\Support;

use App\Models\Survey;
use App\Models\SurveyQuestion;
use App\Models\SurveyResponse;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SurveyResults
{
    /**
     * @return array<string, mixed>
     */
    public function page(Survey $survey, Request $request, string $kind): array
    {
        $survey->load('questions');
        $questions = $survey->questions;
        $status = $request->string('status')->toString();
        $search = trim($request->string('q')->toString());

        $query = $survey->responses()->with('user:id,name,phone');

        if (in_array($status, ['completed', 'registered', 'in_progress'], true)) {
            $query->where('status', $status);
        }

        if ($search !== '') {
            $like = '%'.$search.'%';
            $query->whereHas('user', function ($user) use ($like): void {
                $user->where('name', 'like', $like)
                    ->orWhere('phone', 'like', $like)
                    ->orWhere('email', 'like', $like);
            });
        }

        /** @var LengthAwarePaginator $paginator */
        $paginator = $query->latest()->paginate(20)->withQueryString();

        return [
            'kind' => $kind,
            'survey' => [
                'id' => $survey->id,
                'title' => $survey->title,
                'share_token' => $survey->share_token,
                'share_url' => url('/survey/'.$survey->share_token),
                'status' => $survey->status,
                'persline_type' => $survey->persline_type,
                'questions_count' => $questions->count(),
                'responses_count' => $survey->responses()->count(),
                'completed_responses_count' => $survey->responses()->where('status', 'completed')->count(),
            ],
            'questions' => $questions->map(fn (SurveyQuestion $question) => [
                'id' => $question->id,
                'title' => $question->title,
                'type' => $question->type,
            ])->values()->all(),
            'responses' => $paginator->through(fn (SurveyResponse $response) => $this->presentResponse($response, $questions)),
            'summary' => $this->summary($survey, $questions),
            'filters' => [
                'status' => in_array($status, ['completed', 'registered', 'in_progress'], true) ? $status : '',
                'q' => $search,
            ],
        ];
    }

    public function csv(Survey $survey, string $filenamePrefix = 'survey'): StreamedResponse
    {
        $survey->load('questions');
        $questions = $survey->questions;
        $headers = array_merge(
            ['شناسه پاسخ', 'وضعیت', 'نام کاربر', 'موبایل', 'تعداد پاسخ', 'شروع', 'تکمیل'],
            $questions->map(fn (SurveyQuestion $question) => $question->title)->all(),
        );

        return response()->streamDownload(function () use ($survey, $questions, $headers): void {
            $output = fopen('php://output', 'wb');
            fwrite($output, "\xEF\xBB\xBF");
            fputcsv($output, $headers, ';');

            $survey->responses()->with('user:id,name,phone')->latest()->chunk(200, function ($responses) use ($output, $questions): void {
                foreach ($responses as $response) {
                    $answers = $response->answers ?? [];
                    $row = [
                        $response->id,
                        $response->status,
                        $response->user?->name ?? 'مهمان',
                        $response->user?->phone ?? '',
                        $response->answered_count,
                        $response->created_at?->format('Y-m-d H:i') ?? '',
                        $response->completed_at?->format('Y-m-d H:i') ?? '',
                    ];
                    foreach ($questions as $question) {
                        $row[] = $this->formatAnswer($answers[(string) $question->id] ?? $answers[$question->id] ?? null);
                    }
                    fputcsv($output, $row, ';');
                }
            });

            fclose($output);
        }, $filenamePrefix.'-'.$survey->id.'-responses.csv', [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Cache-Control' => 'no-store',
        ]);
    }

    /**
     * @param  Collection<int, SurveyQuestion>  $questions
     * @return array<string, mixed>
     */
    public function presentResponse(SurveyResponse $response, Collection $questions): array
    {
        $answers = $response->answers ?? [];

        return [
            'id' => $response->id,
            'status' => $response->status,
            'answered_count' => $response->answered_count,
            'user' => $response->user ? [
                'id' => $response->user->id,
                'name' => $response->user->name,
                'phone' => $response->user->phone,
            ] : null,
            'created_at' => $response->created_at?->format('Y/m/d H:i'),
            'completed_at' => $response->completed_at?->format('Y/m/d H:i'),
            'answers' => $questions->map(fn (SurveyQuestion $question) => [
                'question_id' => $question->id,
                'title' => $question->title,
                'type' => $question->type,
                'value' => $this->formatAnswer($answers[(string) $question->id] ?? $answers[$question->id] ?? null),
            ])->values()->all(),
        ];
    }

    /**
     * @param  Collection<int, SurveyQuestion>  $questions
     * @return array<string, mixed>
     */
    private function summary(Survey $survey, Collection $questions): array
    {
        $completed = $survey->responses()->where('status', 'completed')->get(['id', 'status', 'answers']);
        $breakdown = [];

        foreach ($questions as $question) {
            if (! in_array($question->type, ['single', 'multiple', 'yes_no', 'rating'], true)) {
                $breakdown[] = [
                    'id' => $question->id,
                    'title' => $question->title,
                    'type' => $question->type,
                    'answered' => $completed->filter(fn (SurveyResponse $response) => ! $this->isEmpty($response->answers[(string) $question->id] ?? $response->answers[$question->id] ?? null))->count(),
                    'options' => [],
                ];
                continue;
            }

            $options = $question->type === 'yes_no'
                ? ['بله', 'خیر']
                : ($question->type === 'rating' ? ['1', '2', '3', '4', '5'] : array_map('strval', $question->options ?? []));
            $counts = array_fill_keys($options, 0);
            $answered = 0;

            foreach ($completed as $response) {
                $value = $response->answers[(string) $question->id] ?? $response->answers[$question->id] ?? null;
                if ($this->isEmpty($value)) {
                    continue;
                }
                $answered++;
                foreach ((array) $value as $item) {
                    $key = (string) $item;
                    if (! array_key_exists($key, $counts)) {
                        $counts[$key] = 0;
                    }
                    $counts[$key]++;
                }
            }

            $breakdown[] = [
                'id' => $question->id,
                'title' => $question->title,
                'type' => $question->type,
                'answered' => $answered,
                'options' => collect($counts)->map(fn (int $count, string $label) => [
                    'label' => $label,
                    'count' => $count,
                    'percent' => $answered > 0 ? (int) round(($count / $answered) * 100) : 0,
                ])->values()->all(),
            ];
        }

        return [
            'total' => $survey->responses()->count(),
            'completed' => $survey->responses()->where('status', 'completed')->count(),
            'registered' => $survey->responses()->where('status', 'registered')->count(),
            'in_progress' => $survey->responses()->where('status', 'in_progress')->count(),
            'questions' => $breakdown,
        ];
    }

    private function formatAnswer(mixed $value): string
    {
        if ($this->isEmpty($value)) {
            return '';
        }

        if (is_array($value)) {
            return collect($value)->filter(fn ($item) => (string) $item !== '')->map(fn ($item) => (string) $item)->implode('، ');
        }

        return (string) $value;
    }

    private function isEmpty(mixed $value): bool
    {
        return $value === null || $value === '' || (is_array($value) && count(array_filter($value, fn ($item) => $item !== '' && $item !== null)) === 0);
    }
}
