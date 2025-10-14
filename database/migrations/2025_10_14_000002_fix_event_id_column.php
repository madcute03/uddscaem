<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Only proceed if the players table exists
        if (Schema::hasTable('players')) {
            // If event_id doesn't exist, add it
            if (!Schema::hasColumn('players', 'event_id')) {
                Schema::table('players', function (Blueprint $table) {
                    $table->foreignId('event_id')->after('id')->constrained()->onDelete('cascade');
                });
            }
        }
    }

    public function down()
    {
        // Only proceed if the players table exists
        if (Schema::hasTable('players')) {
            // If event_id exists, drop it
            if (Schema::hasColumn('players', 'event_id')) {
                Schema::table('players', function (Blueprint $table) {
                    $table->dropForeign(['event_id']);
                    $table->dropColumn('event_id');
                });
            }
        }
    }
};
