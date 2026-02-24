<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Crée les tables quiz_sessions et quiz_session_answers si elles n'existent pas.
 */
final class Version20260218100000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create quiz_sessions and quiz_session_answers if not exist';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('CREATE TABLE IF NOT EXISTS quiz_sessions (
            id VARCHAR(36) NOT NULL,
            user_id VARCHAR(36) NOT NULL,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            final_job_id VARCHAR(255) DEFAULT NULL,
            scores JSON DEFAULT NULL,
            PRIMARY KEY(id)
        )');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_sessions_user ON quiz_sessions (user_id)');

        $this->addSql('CREATE TABLE IF NOT EXISTS quiz_session_answers (
            id VARCHAR(36) NOT NULL,
            session_id VARCHAR(36) NOT NULL,
            question_id VARCHAR(255) NOT NULL,
            answer_id VARCHAR(255) DEFAULT NULL,
            text_value TEXT DEFAULT NULL,
            created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL,
            PRIMARY KEY(id)
        )');
        $this->addSql('CREATE INDEX IF NOT EXISTS idx_answers_session ON quiz_session_answers (session_id)');
        $this->addSql('DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM pg_constraint WHERE conname = \'quiz_session_answers_session_id_fkey\'
                ) THEN
                    ALTER TABLE quiz_session_answers ADD CONSTRAINT quiz_session_answers_session_id_fkey
                    FOREIGN KEY (session_id) REFERENCES quiz_sessions(id) ON DELETE CASCADE;
                END IF;
            END $$');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('DROP TABLE IF EXISTS quiz_session_answers');
        $this->addSql('DROP TABLE IF EXISTS quiz_sessions');
    }
}
