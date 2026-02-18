<?php

declare(strict_types=1);

namespace App\Command;

use Doctrine\DBAL\Connection;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:fix-quiz-session-answers-schema',
    description: 'Ajoute les colonnes job_id et question_text si manquantes dans quiz_session_answers',
)]
final class FixQuizSessionAnswersSchemaCommand extends Command
{
    public function __construct(private readonly Connection $connection)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        try {
            $this->connection->executeStatement(
                'ALTER TABLE quiz_session_answers ADD COLUMN IF NOT EXISTS job_id VARCHAR(255) DEFAULT NULL'
            );
            $this->connection->executeStatement(
                'ALTER TABLE quiz_session_answers ADD COLUMN IF NOT EXISTS question_text TEXT DEFAULT NULL'
            );
            $io->success('Colonnes job_id et question_text ajoutées (ou déjà présentes).');
            return Command::SUCCESS;
        } catch (\Throwable $e) {
            $io->error('Erreur : ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
