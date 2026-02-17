<?php

namespace App\Command;

use Doctrine\DBAL\Connection;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'app:database:test',
    description: 'Teste la connexion à la base de données et affiche les informations',
)]
final class DatabaseTestCommand extends Command
{
    public function __construct(private readonly Connection $connection)
    {
        parent::__construct();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        try {
            // Test de connexion
            $io->info('Test de connexion à la base de données...');
            
            // Récupération des informations de la base de données
            $databaseName = $this->connection->fetchOne('SELECT current_database()');
            $version = $this->connection->fetchOne('SELECT version()');
            $currentUser = $this->connection->fetchOne('SELECT current_user');
            $serverVersion = $this->connection->getServerVersion();
            
            $io->success('Connexion réussie !');
            $io->table(
                ['Propriété', 'Valeur'],
                [
                    ['Base de données', $databaseName],
                    ['Utilisateur', $currentUser],
                    ['Version PostgreSQL', $version],
                    ['Version serveur (DBAL)', $serverVersion],
                ]
            );

            // Test de requête simple
            $io->info('Test d\'une requête simple...');
            $result = $this->connection->fetchOne('SELECT 1 as test');
            if ($result === '1') {
                $io->success('Requête test réussie !');
            }

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $io->error('Erreur de connexion : ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
