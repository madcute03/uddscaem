<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Player;
use Illuminate\Support\Facades\Mail;
use App\Mail\PlayerStatusMail;
use Inertia\Inertia;

class PlayerController extends Controller
{
    public function updateStatus(Request $request)
    {
        $player = Player::findOrFail($request->player_id);

        $player->status = $request->status;
        $player->save();

        // Send email notification
        Mail::to($request->email)->send(new PlayerStatusMail($player));

        // Redirect back with flash message for Inertia
        return back()->with([
            'success' => "Player status updated to {$player->status}."
        ]);
    }
}
