<?php

declare(strict_types=1);

namespace DoctrineMigrations;

use Doctrine\DBAL\Schema\Schema;
use Doctrine\Migrations\AbstractMigration;

final class Version20260224140000 extends AbstractMigration
{
    public function getDescription(): string
    {
        return 'Create job_categories table for managing HR domains';
    }

    public function up(Schema $schema): void
    {
        $this->addSql("
            CREATE TABLE IF NOT EXISTS job_categories (
                id VARCHAR(255) NOT NULL,
                name VARCHAR(255) NOT NULL,
                emoji VARCHAR(10) DEFAULT NULL,
                description TEXT DEFAULT NULL,
                status VARCHAR(50) DEFAULT NULL,
                position INT NOT NULL DEFAULT 0,
                created_at TIMESTAMP(0) WITHOUT TIME ZONE NOT NULL DEFAULT NOW(),
                PRIMARY KEY(id)
            )
        ");

        // Seed the 18 HR domains from the SUP des RH guide
        $this->addSql("
            INSERT INTO job_categories (id, name, emoji, status, position, created_at) VALUES
            ('cat-01', 'Recrutement & Acquisition de Talents',         '🎯', 'established', 1,  NOW()),
            ('cat-02', 'Formation & Développement des Compétences',    '📚', 'established', 2,  NOW()),
            ('cat-03', 'Gestion Administrative du Personnel',          '📋', 'established', 3,  NOW()),
            ('cat-04', 'Paie & Rémunération',                         '💰', 'established', 4,  NOW()),
            ('cat-05', 'Relations Sociales & Dialogue Social',         '🤝', 'established', 5,  NOW()),
            ('cat-06', 'Management & Leadership RH',                   '👑', 'established', 6,  NOW()),
            ('cat-07', 'Conseil & Business Partner RH',                '💼', 'established', 7,  NOW()),
            ('cat-08', 'Marque Employeur & Communication RH',          '📢', 'established', 8,  NOW()),
            ('cat-09', 'Diversité, Équité & Inclusion (DEI)',          '🌈', 'established', 9,  NOW()),
            ('cat-10', 'Qualité de Vie & Bien-être au Travail',        '🌿', 'established', 10, NOW()),
            ('cat-11', 'Transformation Digitale RH',                   '💻', 'emerging',    11, NOW()),
            ('cat-12', 'Data RH & Analytique',                         '📊', 'emerging',    12, NOW()),
            ('cat-13', 'Mobilité Internationale & RH Global',          '🌍', 'established', 13, NOW()),
            ('cat-14', 'Droit du Travail & Conformité',                '⚖️',  'established', 14, NOW()),
            ('cat-15', 'Santé, Sécurité & Prévention des Risques',    '🛡️',  'established', 15, NOW()),
            ('cat-16', 'Gestion des Talents & Mobilité Interne',       '🚀', 'established', 16, NOW()),
            ('cat-17', 'Culture Organisationnelle & Conduite du Changement', '🔄', 'established', 17, NOW()),
            ('cat-18', 'Innovation RH & Futur du Travail',             '🔮', 'emerging',    18, NOW())
            ON CONFLICT (id) DO NOTHING
        ");
    }

    public function down(Schema $schema): void
    {
        $this->addSql("DROP TABLE IF EXISTS job_categories");
    }
}
