<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (Schema::hasTable('events') && !Schema::hasColumn('events', 'event_end_date')) {
            Schema::table('events', function (Blueprint $table) {
                $table->date('event_end_date')->nullable()->after('event_date');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('events') && Schema::hasColumn('events', 'event_end_date')) {
            Schema::table('events', function (Blueprint $table) {
                $table->dropColumn('event_end_date');
            });
        }
    }
};
