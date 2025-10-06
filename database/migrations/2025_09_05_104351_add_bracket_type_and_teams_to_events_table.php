<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->string('bracket_type')->nullable()->after('event_date'); // add after existing column
            $table->unsignedInteger('teams')->nullable()->after('bracket_type');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['bracket_type', 'teams']);
        });
    }
};
