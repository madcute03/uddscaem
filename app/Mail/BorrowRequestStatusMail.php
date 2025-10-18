<?php

namespace App\Mail;

use App\Models\BorrowRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class BorrowRequestStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public BorrowRequest $borrowRequest;
    public string $action;
    public ?string $note;

    public function __construct(BorrowRequest $borrowRequest, string $action, ?string $note = null)
    {
        $this->borrowRequest = $borrowRequest;
        $this->action = $action; // approved|denied|returned
        $this->note = $note;
    }

    public function build(): self
    {
        $subject = match ($this->action) {
            'approved' => 'Your borrow request has been approved',
            'denied' => 'Your borrow request has been denied',
            'returned' => 'Return confirmation for borrowed item',
            default => 'Update on your borrow request',
        };

        return $this->subject($subject)
            ->view('emails.borrow_status');
    }
}


