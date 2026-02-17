<?php

namespace App\Command;

use Doctrine\DBAL\Connection;
use Symfony\Component\Console\Attribute\AsCommand;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;
use Symfony\Component\Console\Style\SymfonyStyle;

#[AsCommand(
    name: 'doctrine:database:info',
    description: 'Affiche les informations sur la base de données configurée',
)]
final class DatabaseInfoCommand extends Command
{
    public function __construct(private readonly Connection $connection)
    {
        parent::__construct();
    }

    protected function configure(): void
    {
        $this
            ->addOption('connection', null, InputOption::VALUE_OPTIONAL, 'Le nom de la connexion à utiliser', 'default')
            ->setHelp(<<<'HELP'
La commande <info>%command.name%</info> affiche les informations détaillées sur la base de données configurée,
incluant le nom de la base, l'utilisateur, la version PostgreSQL, et les statistiques de connexion.

  <info>php %command.full_name%</info>

Pour spécifier une connexion différente :

  <info>php %command.full_name% --connection=default</info>
HELP
            );
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $io = new SymfonyStyle($input, $output);

        try {
            $io->title('Informations sur la base de données');

            // Informations de base
            $databaseName = $this->connection->fetchOne('SELECT current_database()');
            $version = $this->connection->fetchOne('SELECT version()');
            $currentUser = $this->connection->fetchOne('SELECT current_user');
            $serverVersion = $this->connection->getServerVersion();
            
            // Informations supplémentaires
            $connectionParams = $this->connection->getParams();
            $host = $connectionParams['host'] ?? 'N/A';
            $port = $connectionParams['port'] ?? 'N/A';
            $driver = $connectionParams['driver'] ?? 'N/A';
            
            // Statistiques de la base de données
            $dbSize = $this->connection->fetchOne(
                "SELECT pg_size_pretty(pg_database_size(current_database()))"
            );
            $numConnections = $this->connection->fetchOne(
                "SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()"
            );
            
            $io->section('Connexion');
            $io->table(
                ['Propriété', 'Valeur'],
                [
                    ['Driver', $driver],
                    ['Hôte', $host],
                    ['Port', (string) $port],
                    ['Base de données', $databaseName],
                    ['Utilisateur', $currentUser],
                ]
            );

            $io->section('Version');
            $io->table(
                ['Type', 'Valeur'],
                [
                    ['Version PostgreSQL complète', $version],
                    ['Version serveur (DBAL)', $serverVersion],
                ]
            );

            $io->section('Statistiques');
            $io->table(
                ['Métrique', 'Valeur'],
                [
                    ['Taille de la base de données', $dbSize],
                    ['Connexions actives', $numConnections],
                ]
            );

            // Test de connexion
            $io->section('Test de connexion');
            $testResult = $this->connection->fetchOne('SELECT 1');
            if ($testResult == 1 || $testResult === '1') {
                $io->success('✓ Connexion active et fonctionnelle');
            } else {
                $io->warning('⚠ Connexion établie mais requête de test échouée');
            }

            return Command::SUCCESS;
        } catch (\Exception $e) {
            $io->error('Erreur lors de la récupération des informations : ' . $e->getMessage());
            if ($output->isVerbose()) {
                $io->writeln($e->getTraceAsString());
            }
            return Command::FAILURE;
        }
    }
}
