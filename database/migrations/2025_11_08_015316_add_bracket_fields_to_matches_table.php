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
        Schema::table('matches', function (Blueprint $table) {
            $table->string('match_id')->nullable()->after('id');
            $table->integer('losers_round')->nullable()->after('round');
            $table->string('round_name')->nullable()->after('losers_round');
            $table->integer('position')->nullable()->after('round_name');
            $table->integer('team1_seed')->nullable()->after('team1_id');
            $table->integer('team2_seed')->nullable()->after('team2_id');
            $table->string('previous_match_loser_1')->nullable()->after('loser_to');
            $table->string('previous_match_loser_2')->nullable()->after('previous_match_loser_1');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('matches', function (Blueprint $table) {
            $table->dropColumn([
                'match_id',
                'losers_round',
                'round_name',
                'position',
                'team1_seed',
                'team2_seed',
                'previous_match_loser_1',
                'previous_match_loser_2',
            ]);
        });
    }
};
