<p>Hi {{ $player->name }},</p>
<p>You have received a message from the event organizer:</p>
<div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #007bff;">
    {!! nl2br(e($playerMessage ?? '')) !!}
</div>
@if($player->team_name)
<p><strong>Team:</strong> {{ $player->team_name }}</p>
@endif
<p>Thank you!</p>
