<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

/**
 * Fiche RH : salaire, taux d'embauche, turnover, indicateurs, vidéo.
 */
final class Version20260217200000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Add fiche RH fields to jobs: salary, hiring_rate, turnover_rate, indicators, video_url';
    }

    public function up(Schema $schema): void
    {
        $this->addSql('ALTER TABLE jobs ADD salary VARCHAR(255) DEFAULT NULL');
        $this->addSql('ALTER TABLE jobs ADD hiring_rate DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE jobs ADD turnover_rate DOUBLE PRECISION DEFAULT NULL');
        $this->addSql('ALTER TABLE jobs ADD indicators JSON DEFAULT NULL');
        $this->addSql('ALTER TABLE jobs ADD video_url VARCHAR(1024) DEFAULT NULL');

        $this->addSql('CREATE TABLE quizzes (id VARCHAR(36) NOT NULL, job_id VARCHAR(255) NOT NULL, name VARCHAR(255) NOT NULL, questions JSON DEFAULT NULL, created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL, PRIMARY KEY(id))');
        $this->addSql('CREATE INDEX IDX_quizzes_job_id ON quizzes (job_id)');
        $this->addSql('ALTER TABLE quizzes ADD CONSTRAINT FK_quizzes_job FOREIGN KEY (job_id) REFERENCES jobs (id) ON DELETE CASCADE NOT DEFERRABLE INITIALLY IMMEDIATE');
    }

    public function down(Schema $schema): void
    {
        $this->addSql('ALTER TABLE jobs DROP salary');
        $this->addSql('ALTER TABLE jobs DROP hiring_rate');
        $this->addSql('ALTER TABLE jobs DROP turnover_rate');
        $this->addSql('ALTER TABLE jobs DROP indicators');
        $this->addSql('ALTER TABLE jobs DROP video_url');

        $this->addSql('ALTER TABLE quizzes DROP CONSTRAINT FK_quizzes_job');
        $this->addSql('DROP TABLE quizzes');
    }
}
