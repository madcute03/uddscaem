<div style="font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'Apple Color Emoji', 'Segoe UI Emoji';">
    <h2 style="margin-bottom: 8px;">SCAEMS Borrow Request Update</h2>
    <p style="margin-top: 0;">Hello {{ $borrowRequest->student_name }},</p>

    @if ($action === 'approved')
        <p>Your request for <strong>{{ $borrowRequest->item->name }}</strong> has been approved.</p>
        <p>Please check pickup instructions in this email or the portal.</p>
    @elseif ($action === 'denied')
        <p>Your request for <strong>{{ $borrowRequest->item->name }}</strong> was denied.</p>
    @elseif ($action === 'returned')
        <p>We have marked your <strong>{{ $borrowRequest->item->name }}</strong> as returned. Thank you!</p>
    @endif

    @if (!empty($note))
        <p><strong>Note:</strong> {{ $note }}</p>
    @endif

    <p>Regards,<br/>SCAEMS Team</p>
</div>


