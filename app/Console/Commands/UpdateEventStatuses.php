<?php

namespace App\Console\Commands;

use App\Models\Event;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class UpdateEventStatuses extends Command
{
    protected $signature = 'events:update-statuses';
    protected $description = 'Update event statuses based on their dates';

    public function handle()
    {
        $today = now()->toDateString();
        
        // Log start of the process
        Log::info('Starting event status update process');
        
        // Update events with end date in the past
        $updatedWithEndDate = Event::whereNotNull('event_end_date')
            ->whereDate('event_end_date', '<', $today)
            ->where('is_done', false)
            ->update(['is_done' => true]);
            
        // Update events without end date but with start date in the past
        $updatedWithoutEndDate = Event::whereNull('event_end_date')
            ->whereDate('event_date', '<', $today)
            ->where('is_done', false)
            ->update(['is_done' => true]);
            
        $totalUpdated = $updatedWithEndDate + $updatedWithoutEndDate;
        
        Log::info("Updated $totalUpdated events (with end date: $updatedWithEndDate, without end date: $updatedWithoutEndDate)");
        
        $this->info("Successfully updated $totalUpdated events.");
        
        return 0;
    }
}
