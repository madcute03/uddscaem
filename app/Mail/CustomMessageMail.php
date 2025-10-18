<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class CustomMessageMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $email;
    public string $message;

    public function __construct(string $email, string $message)
    {
        $this->email = $email;
        $this->message = $message;
    }

    public function build(): self
    {
        return $this->subject('Message from Admin')
            ->view('emails.custom_message')
            ->with([
                'recipientEmail' => $this->email,
                'messageContent' => $this->message,
            ]);
    }
}
