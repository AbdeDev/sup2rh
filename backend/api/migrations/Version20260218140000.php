<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260218140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add job_id and question_text to quiz_session_answers';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_session_answers' AND column_name = 'job_id') THEN
                    ALTER TABLE quiz_session_answers ADD COLUMN job_id VARCHAR(255) DEFAULT NULL;
                END IF;
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'quiz_session_answers' AND column_name = 'question_text') THEN
                    ALTER TABLE quiz_session_answers ADD COLUMN question_text TEXT DEFAULT NULL;
                END IF;
            END $$");
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE quiz_session_answers DROP COLUMN IF EXISTS job_id');
        $this->addSql('ALTER TABLE quiz_session_answers DROP COLUMN IF EXISTS question_text');
    }
}
