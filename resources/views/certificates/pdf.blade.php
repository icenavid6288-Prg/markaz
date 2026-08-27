{{-- Certificate PDF (mPDF). No images — typography only, safe without GD. --}}
<!DOCTYPE html>
<html lang="fa" dir="rtl">
<head>
    <meta charset="utf-8">
    <style>
        body {
            direction: rtl;
            font-family: vazirmatn, sans-serif;
            color: #0b1f3a;
            background: #ffffff;
            margin: 0;
            padding: 0;
        }
        .frame {
            border: 2px solid #c9a227;
            border-radius: 18px;
            padding: 6px;
        }
        .frame-inner {
            border: 1px solid #c9a227;
            border-radius: 12px;
            padding: 34px 40px;
        }
        .header {
            text-align: center;
        }
        .center-title {
            font-size: 17pt;
            font-weight: bold;
            color: #0c3b2e;
        }
        .center-subtitle {
            font-size: 8.5pt;
            color: #7a8a99;
            margin-top: 2px;
        }
        .divider {
            border-bottom: 1px solid #d9b94e;
            margin: 14px auto 12px;
            width: 60%;
        }
        .badge {
            background: #c9a227;
            color: #ffffff;
            font-size: 11pt;
            font-weight: bold;
            border-radius: 24px;
            padding: 5px 22px;
            width: fit-content;
            margin: 0 auto;
        }
        .body-text {
            text-align: center;
            font-size: 10.5pt;
            color: #4a5a68;
            margin-top: 18px;
        }
        .holder-name {
            text-align: center;
            font-size: 27pt;
            font-weight: bold;
            color: #0c3b2e;
            margin: 14px 0 4px;
        }
        .holder-label {
            text-align: center;
            font-size: 10.5pt;
            color: #4a5a68;
        }
        .statement {
            text-align: center;
            font-size: 10.5pt;
            line-height: 1.9;
            color: #33475a;
            margin: 22px 26px 0;
        }
        .statement strong {
            color: #1d7b56;
        }
        .duration {
            text-align: center;
            font-size: 9pt;
            color: #7a8a99;
            margin-top: 6px;
        }
        .bottom-table {
            width: 100%;
            margin-top: 30px;
            border-collapse: collapse;
        }
        .bottom-table td {
            vertical-align: bottom;
            padding: 0 8px;
        }
        .meta {
            font-size: 9pt;
            color: #4a5a68;
            line-height: 1.9;
        }
        .meta strong {
            color: #0b1f3a;
        }
        .meta .number {
            font-weight: bold;
            color: #0c3b2e;
            letter-spacing: 0.5px;
            direction: ltr;
            unicode-bidi: embed;
        }
        .meta .verify {
            font-size: 7.5pt;
            color: #8a97a5;
        }
        .qr-cell {
            text-align: center;
        }
        .qr-caption {
            font-size: 7.5pt;
            color: #8a97a5;
            margin-top: 3px;
        }
        .signature {
            text-align: left;
        }
        .sign-line {
            border-bottom: 1px solid #33475a;
            width: 140px;
            margin: 0 auto 0 0;
        }
        .sign-name {
            font-size: 12pt;
            font-weight: bold;
            color: #0b1f3a;
            margin-top: 6px;
            text-align: left;
        }
        .sign-role {
            font-size: 7.5pt;
            color: #7a8a99;
            text-align: left;
            margin-top: 2px;
        }
    </style>
</head>
<body>
    <div class="frame">
        <div class="frame-inner">
            <div class="header">
                <div class="center-title">مرکز رشد و کارآفرینی دکتر بیدی</div>
                <div class="center-subtitle">Personal Growth &amp; Entrepreneurship Center</div>
            </div>
            <div class="divider"></div>
            <div class="badge">گواهینامه پایان دوره</div>

            <div class="body-text">این گواهینامه به</div>
            <div class="holder-name">{{ $name }}</div>
            <div class="holder-label">اعطا می‌شود</div>

            <p class="statement">بدین‌وسیله تأیید می‌گردد که ایشان با موفقیت و پشتکار، دوره آموزشی
                <strong>«{{ $course }}»</strong> را به پایان رسانده و شایستگی‌های لازم را کسب نموده است.</p>
            @if ($courseHours > 0)
                <div class="duration">مدت دوره: {{ $courseHours }} ساعت</div>
            @endif

            <table class="bottom-table">
                <tr>
                    <td class="meta" style="width: 36%;">
                        <div>تاریخ صدور: <strong>{{ $issuedAt }}</strong></div>
                        <div>شماره گواهینامه: <span class="number">{{ $number }}</span></div>
                        <div class="verify">استعلام آنلاین: {{ str_replace(['http://', 'https://'], '', $verifyUrl) }}</div>
                    </td>
                    <td class="qr-cell" style="width: 28%;">
                        <qrcode value="{{ $verifyUrl }}" error-correction="M" size="72" quiet-zone="1" />
                        <div class="qr-caption">استعلام آنلاین با دوربین</div>
                    </td>
                    <td class="signature" style="width: 36%;">
                        <div class="sign-line"></div>
                        <div class="sign-name">دکتر بیدی</div>
                        <div class="sign-role">بنیان‌گذار و مدیر مرکز رشد و کارآفرینی</div>
                    </td>
                </tr>
            </table>
        </div>
    </div>
</body>
</html>
