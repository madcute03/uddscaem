<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\RegisteredPlayer;
use Illuminate\Support\Facades\Mail;
use App\Mail\PlayerStatusMail;
use App\Mail\PlayerMessageMail;
use Inertia\Inertia;

class PlayerController extends Controller
{
    public function updateStatus(Request $request)
    {
        $player = RegisteredPlayer::findOrFail($request->player_id);

        $player->status = $request->status;
        $player->save();

        // Send email notification
        Mail::to($request->email)->send(new PlayerStatusMail($player));

        // Redirect back with flash message for Inertia
        return back()->with([
            'success' => "Player status updated to {$player->status}."
        ]);
    }

    public function sendMessage(Request $request)
    {
        $request->validate([
            'player_id' => 'required|exists:registered_players,id',
            'message' => 'nullable|string|max:1000',
            'email' => 'required|email',
            'team_name' => 'nullable|string',
            'is_default' => 'nullable|boolean',
            'action' => 'nullable|string', // Add action parameter
        ]);

        $player = RegisteredPlayer::findOrFail($request->player_id);
        $customMessage = (string) $request->message;
        $isDefault = $request->boolean('is_default', false);
        $action = $request->input('action', $player->status); // Use provided action or fallback to current status

        // Generate default message based on the action taken
        $defaultMessage = "";
        if ($isDefault) {
            switch ($action) {
                case 'approved':
                    $defaultMessage = "Your registration has been approved for the event.";
                    break;
                case 'disapproved':
                    $defaultMessage = "Your registration has been disapproved for the event.";
                    break;
                default:
                    $defaultMessage = "Your registration status has been updated.";
                    break;
            }
        }

        // Combine default message with custom message if both exist
        $finalMessage = "";
        if ($isDefault && $customMessage) {
            $finalMessage = $defaultMessage . "\n\n" . $customMessage;
        } elseif ($isDefault) {
            $finalMessage = $defaultMessage;
        } else {
            $finalMessage = $customMessage;
        }

        // If this is a team message, send to all team members
        if ($request->team_name) {
            $teamMembers = RegisteredPlayer::where('team_name', $request->team_name)
                                          ->where('event_id', $player->event_id)
                                          ->get();

            foreach ($teamMembers as $member) {
                Mail::to($member->email)->send(new PlayerMessageMail($member, $finalMessage));
            }
        } else {
            // Send message to individual player
            Mail::to($request->email)->send(new PlayerMessageMail($player, $finalMessage));
        }

        return back()->with([
            'success' => 'Message sent successfully.'
        ]);
    }
}
