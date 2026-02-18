<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260218130000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add rating column to feedbacks';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'feedbacks' AND column_name = 'rating') THEN
                    ALTER TABLE feedbacks ADD COLUMN rating SMALLINT DEFAULT NULL;
                END IF;
            END $$");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("ALTER TABLE feedbacks DROP COLUMN IF EXISTS rating");
    }
}
