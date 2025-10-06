<?php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;


class PlayerStatusMail extends Mailable
{
    use Queueable, SerializesModels;

    public $player;

    public function __construct($player)
    {
        $this->player = $player;
    }

    public function build()
    {
        return $this->subject('Your Registration Status')
                    ->view('emails.player_status'); // Blade view for email
    }
}
