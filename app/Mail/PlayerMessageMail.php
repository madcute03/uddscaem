<?php
namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PlayerMessageMail extends Mailable
{
    use Queueable, SerializesModels;

    public $player;
    public $playerMessage;

    public function __construct($player, $message)
    {
        $this->player = $player;
        $this->playerMessage = $message;
    }

    public function build()
    {
        return $this->subject('Message from Event Organizer')
                    ->view('emails.player_message'); // Blade view for email
    }
}
