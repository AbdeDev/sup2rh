<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Migration initiale : crée toutes les tables de base si elles n'existent pas encore.
 * Doit s'exécuter en PREMIER sur une base vierge.
 */
final class Version20260101000000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Initial schema: create base tables (jobs, profiles, quiz_sessions, quiz_session_answers) if not exists';
    }

    public function up(Schema $schema): void
    {
        // jobs — fiches métier RH
        $this->addSql("
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT DEFAULT NULL,
                PRIMARY KEY (id)
            )
        ");

        // profiles — utilisateurs (sync Supabase auth)
        $this->addSql("
            CREATE TABLE IF NOT EXISTS profiles (
                id UUID NOT NULL,
                role TEXT NOT NULL DEFAULT 'USER',
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                PRIMARY KEY (id)
            )
        ");

        // quiz_sessions — sessions de quiz utilisateur
        $this->addSql("
            CREATE TABLE IF NOT EXISTS quiz_sessions (
                id UUID NOT NULL DEFAULT gen_random_uuid(),
                user_id TEXT NOT NULL,
                final_job_id TEXT DEFAULT NULL,
                scores JSONB DEFAULT '{}',
                created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
                PRIMARY KEY (id)
            )
        ");
        $this->addSql("CREATE INDEX IF NOT EXISTS idx_sessions_user ON quiz_sessions (user_id)");

        // quiz_session_answers — réponses par session
        $this->addSql("
            CREATE TABLE IF NOT EXISTS quiz_session_answers (
                id UUID NOT NULL DEFAULT gen_random_uuid(),
                session_id UUID NOT NULL,
                question_id TEXT NOT NULL,
                answer_id TEXT DEFAULT NULL,
                job_id TEXT DEFAULT NULL,
                text_value TEXT DEFAULT NULL,
                PRIMARY KEY (id)
            )
        ");
        $this->addSql("CREATE INDEX IF NOT EXISTS idx_answers_session ON quiz_session_answers (session_id)");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS quiz_session_answers');
        $this->addSql('DROP TABLE IF EXISTS quiz_sessions');
        $this->addSql('DROP TABLE IF EXISTS profiles');
        $this->addSql('DROP TABLE IF EXISTS jobs');
    }
}
