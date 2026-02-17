# 🚀 Guide Complet - Backend Symfony + Doctrine + Supabase

## 📋 État Actuel du Projet

✅ **Déjà fait :**

- Symfony 8.0 installé
- Doctrine configuré et connecté à Supabase
- CORS configuré (Nelmio)
- Security bundle installé
- Validator installé
- Serializer installé
- HealthController existe
- TreesController existe (GET list, GET one, POST create)
- Tree entity existe (mais incomplète)
- AuthListener existe
- SupabaseJwtVerifier existe
- ProfileService existe

❌ **À faire :**

- Compléter l'entité Tree (name, createdAt)
- Créer les migrations
- Compléter le CRUD (PUT, DELETE)
- Ajouter validation
- Créer endpoint /api/me
- Fixtures/Seed
- Tests

---

## 📦 Phase 1 : Compléter l'Entité Tree

### Étape 1.1 : Compléter Tree.php

**Fichier :** `src/Entity/Tree.php`

```php
<?php

namespace App\Entity;

use App\Repository\TreeRepository;
use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Validator\Constraints as Assert;

#[ORM\Entity(repositoryClass: TreeRepository::class)]
#[ORM\Table(name: 'trees')]
class Tree
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 255)]
    #[Assert\NotBlank(message: 'Le nom est requis')]
    #[Assert\Length(min: 2, max: 255, minMessage: 'Le nom doit contenir au moins 2 caractères')]
    private ?string $name = null;

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private ?\DateTimeImmutable $createdAt = null;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): ?int
    {
        return $this->id;
    }

    public function getName(): ?string
    {
        return $this->name;
    }

    public function setName(string $name): static
    {
        $this->name = $name;
        return $this;
    }

    public function getCreatedAt(): ?\DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }
}
```

**Commandes :**

```bash
# Vérifier que l'entité est bien détectée
php bin/console doctrine:mapping:info
```

---

## 📦 Phase 2 : Migrations

### Étape 2.1 : Générer la migration

```bash
php bin/console make:migration
```

### Étape 2.2 : Vérifier le fichier de migration

**Fichier généré :** `migrations/VersionYYYYMMDDHHMMSS.php`

Vérifie qu'il contient bien :

- `CREATE TABLE trees`
- Colonnes : `id`, `name`, `created_at`

### Étape 2.3 : Appliquer la migration

```bash
php bin/console doctrine:migrations:migrate
# Répondre "yes" si demandé
```

### Étape 2.4 : Valider le schéma

```bash
php bin/console doctrine:schema:validate
```

**Résultat attendu :** `[OK] The mapping files are correct.`

---

## 📦 Phase 3 : Compléter le CRUD Trees

### Étape 3.1 : Compléter TreesController.php

**Fichier :** `src/Controller/Api/TreesController.php`

Ajouter les méthodes PUT et DELETE :

```php
<?php

namespace App\Controller\Api;

use App\Entity\Tree;
use App\Repository\TreeRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Validator\Validator\ValidatorInterface;

#[Route('/api/trees', name: 'api_trees_')]
final class TreesController
{
    #[Route('', name: 'list', methods: ['GET'])]
    public function list(TreeRepository $repo): JsonResponse
    {
        $trees = $repo->findBy([], ['createdAt' => 'DESC']);

        $items = array_map(fn (Tree $t) => [
            'id' => $t->getId(),
            'name' => $t->getName(),
            'createdAt' => $t->getCreatedAt()->format(DATE_ATOM),
        ], $trees);

        return new JsonResponse(['items' => $items]);
    }

    #[Route('/{id}', name: 'get', methods: ['GET'])]
    public function get(int $id, TreeRepository $repo): JsonResponse
    {
        $tree = $repo->find($id);

        if (!$tree) {
            return new JsonResponse(['message' => 'Tree not found'], 404);
        }

        return new JsonResponse([
            'id' => $tree->getId(),
            'name' => $tree->getName(),
            'createdAt' => $tree->getCreatedAt()->format(DATE_ATOM),
        ]);
    }

    #[Route('', name: 'create', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        ValidatorInterface $validator
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        $name = is_array($data) ? ($data['name'] ?? null) : null;

        if (!is_string($name) || trim($name) === '') {
            return new JsonResponse(['message' => 'name is required'], 422);
        }

        $tree = new Tree();
        $tree->setName(trim($name));

        $errors = $validator->validate($tree);
        if (count($errors) > 0) {
            $messages = [];
            foreach ($errors as $error) {
                $messages[] = $error->getMessage();
            }
            return new JsonResponse(['message' => 'Validation failed', 'errors' => $messages], 422);
        }

        $em->persist($tree);
        $em->flush();

        return new JsonResponse([
            'id' => $tree->getId(),
            'name' => $tree->getName(),
            'createdAt' => $tree->getCreatedAt()->format(DATE_ATOM),
        ], 201);
    }

    #[Route('/{id}', name: 'update', methods: ['PUT', 'PATCH'])]
    public function update(
        int $id,
        Request $request,
        TreeRepository $repo,
        EntityManagerInterface $em,
        ValidatorInterface $validator
    ): JsonResponse {
        $tree = $repo->find($id);

        if (!$tree) {
            return new JsonResponse(['message' => 'Tree not found'], 404);
        }

        $data = json_decode($request->getContent(), true);
        $name = is_array($data) ? ($data['name'] ?? null) : null;

        if (!is_string($name) || trim($name) === '') {
            return new JsonResponse(['message' => 'name is required'], 422);
        }

        $tree->setName(trim($name));

        $errors = $validator->validate($tree);
        if (count($errors) > 0) {
            $messages = [];
            foreach ($errors as $error) {
                $messages[] = $error->getMessage();
            }
            return new JsonResponse(['message' => 'Validation failed', 'errors' => $messages], 422);
        }

        $em->flush();

        return new JsonResponse([
            'id' => $tree->getId(),
            'name' => $tree->getName(),
            'createdAt' => $tree->getCreatedAt()->format(DATE_ATOM),
        ]);
    }

    #[Route('/{id}', name: 'delete', methods: ['DELETE'])]
    public function delete(int $id, TreeRepository $repo, EntityManagerInterface $em): JsonResponse
    {
        $tree = $repo->find($id);

        if (!$tree) {
            return new JsonResponse(['message' => 'Tree not found'], 404);
        }

        $em->remove($tree);
        $em->flush();

        return new JsonResponse(['message' => 'Tree deleted'], 200);
    }
}
```

### Étape 3.2 : Vérifier les routes

```bash
php bin/console cache:clear
php bin/console debug:router | grep trees
```

**Résultat attendu :**

```
api_trees_list    GET      /api/trees
api_trees_get     GET      /api/trees/{id}
api_trees_create  POST     /api/trees
api_trees_update  PUT      /api/trees/{id}
api_trees_update  PATCH    /api/trees/{id}
api_trees_delete  DELETE   /api/trees/{id}
```

### Étape 3.3 : Tests avec curl

```bash
# 1. Lister (vide au début)
curl -i http://127.0.0.1:8000/api/trees

# 2. Créer un tree
curl -i -X POST http://127.0.0.1:8000/api/trees \
  -H "Content-Type: application/json" \
  -d '{"name":"Oak"}'

# 3. Lister (devrait voir Oak)
curl -i http://127.0.0.1:8000/api/trees

# 4. Récupérer un tree par ID
curl -i http://127.0.0.1:8000/api/trees/1

# 5. Mettre à jour
curl -i -X PUT http://127.0.0.1:8000/api/trees/1 \
  -H "Content-Type: application/json" \
  -d '{"name":"Oak Tree"}'

# 6. Supprimer
curl -i -X DELETE http://127.0.0.1:8000/api/trees/1

# 7. Vérifier suppression
curl -i http://127.0.0.1:8000/api/trees
```

---

## 📦 Phase 4 : Gestion des Erreurs (Optionnel mais Recommandé)

### Étape 4.1 : Créer un EventListener pour les erreurs

**Fichier :** `src/EventListener/ExceptionListener.php`

```php
<?php

namespace App\EventListener;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpKernel\Event\ExceptionEvent;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class ExceptionListener
{
    public function onKernelException(ExceptionEvent $event): void
    {
        $exception = $event->getThrowable();
        $request = $event->getRequest();

        // Ne traiter que les requêtes API
        if (!str_starts_with($request->getPathInfo(), '/api')) {
            return;
        }

        $statusCode = $exception instanceof HttpExceptionInterface
            ? $exception->getStatusCode()
            : Response::HTTP_INTERNAL_SERVER_ERROR;

        $message = $exception->getMessage() ?: 'An error occurred';

        $response = new JsonResponse([
            'message' => $message,
            'status' => $statusCode,
        ], $statusCode);

        $event->setResponse($response);
    }
}
```

### Étape 4.2 : Enregistrer le listener

**Fichier :** `config/services.yaml`

Ajouter dans la section `services:` :

```yaml
services:
    # ... autres services ...

    App\EventListener\ExceptionListener:
        tags:
            - { name: kernel.event_listener, event: kernel.exception }
```

---

## 📦 Phase 5 : Auth Supabase - Endpoint /api/me

### Étape 5.1 : Créer l'entité Profile (si pas déjà fait)

**Fichier :** `src/Entity/Profile.php`

```php
<?php

namespace App\Entity;

use Doctrine\DBAL\Types\Types;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity]
#[ORM\Table(name: 'profiles')]
class Profile
{
    #[ORM\Id]
    #[ORM\Column(type: Types::STRING, length: 255)]
    private string $id; // UUID Supabase

    #[ORM\Column(type: Types::STRING, length: 50, options: ['default' => 'USER'])]
    private string $role = 'USER';

    #[ORM\Column(type: Types::DATETIME_IMMUTABLE)]
    private \DateTimeImmutable $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTimeImmutable();
    }

    public function getId(): string
    {
        return $this->id;
    }

    public function setId(string $id): static
    {
        $this->id = $id;
        return $this;
    }

    public function getRole(): string
    {
        return $this->role;
    }

    public function setRole(string $role): static
    {
        $this->role = $role;
        return $this;
    }

    public function getCreatedAt(): \DateTimeImmutable
    {
        return $this->createdAt;
    }

    public function setCreatedAt(\DateTimeImmutable $createdAt): static
    {
        $this->createdAt = $createdAt;
        return $this;
    }
}
```

### Étape 5.2 : Migration pour Profile

```bash
php bin/console make:migration
php bin/console doctrine:migrations:migrate
```

### Étape 5.3 : Créer le controller /api/me

**Fichier :** `src/Controller/Api/MeController.php`

```php
<?php

namespace App\Controller\Api;

use App\Security\AuthUser;
use App\Services\ProfileService;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/api/me', name: 'api_me_')]
final class MeController extends AbstractController
{
    #[Route('', name: 'get', methods: ['GET'])]
    #[IsGranted('ROLE_USER')]
    public function get(ProfileService $profileService): JsonResponse
    {
        /** @var AuthUser $user */
        $user = $this->getUser();

        // S'assurer que le profile existe
        $profileService->ensureProfile($user->getUserIdentifier());

        $isAdmin = $profileService->isAdmin($user->getUserIdentifier());

        return $this->json([
            'id' => $user->getUserIdentifier(),
            'email' => $user->getEmail(),
            'role' => $isAdmin ? 'ADMIN' : 'USER',
        ]);
    }
}
```

### Étape 5.4 : Configurer Security pour protéger /api/me

**Fichier :** `config/packages/security.yaml`

Modifier la section `access_control` :

```yaml
security:
    # ... autres configs ...

    access_control:
        - { path: ^/api/me, roles: ROLE_USER }
        # - { path: ^/api/admin, roles: ROLE_ADMIN }
```

### Étape 5.5 : Tester /api/me

```bash
# Sans token (devrait retourner 401)
curl -i http://127.0.0.1:8000/api/me

# Avec token Supabase (remplacer YOUR_TOKEN)
curl -i http://127.0.0.1:8000/api/me \
  -H "Authorization: Bearer YOUR_SUPABASE_ACCESS_TOKEN"
```

---

## 📦 Phase 6 : Fixtures / Seed Data

### Étape 6.1 : Installer Doctrine Fixtures

```bash
composer require --dev doctrine/doctrine-fixtures-bundle
```

### Étape 6.2 : Créer une fixture

**Fichier :** `src/DataFixtures/TreeFixtures.php`

```php
<?php

namespace App\DataFixtures;

use App\Entity\Tree;
use Doctrine\Bundle\FixturesBundle\Fixture;
use Doctrine\Persistence\ObjectManager;

class TreeFixtures extends Fixture
{
    public function load(ObjectManager $manager): void
    {
        $trees = [
            'Oak',
            'Pine',
            'Maple',
            'Birch',
            'Cedar',
        ];

        foreach ($trees as $name) {
            $tree = new Tree();
            $tree->setName($name);
            $manager->persist($tree);
        }

        $manager->flush();
    }
}
```

### Étape 6.3 : Charger les fixtures

```bash
php bin/console doctrine:fixtures:load
# Répondre "yes" si demandé
```

---

## 📦 Phase 7 : Pagination (Optionnel)

### Étape 7.1 : Ajouter pagination au TreesController

Modifier la méthode `list()` :

```php
#[Route('', name: 'list', methods: ['GET'])]
public function list(Request $request, TreeRepository $repo): JsonResponse
{
    $page = max(1, (int) ($request->query->get('page', 1)));
    $limit = max(1, min(100, (int) ($request->query->get('limit', 20)));
    $offset = ($page - 1) * $limit;

    $trees = $repo->findBy([], ['createdAt' => 'DESC'], $limit, $offset);
    $total = $repo->count([]);

    $items = array_map(fn (Tree $t) => [
        'id' => $t->getId(),
        'name' => $t->getName(),
        'createdAt' => $t->getCreatedAt()->format(DATE_ATOM),
    ], $trees);

    return new JsonResponse([
        'items' => $items,
        'pagination' => [
            'page' => $page,
            'limit' => $limit,
            'total' => $total,
            'pages' => (int) ceil($total / $limit),
        ],
    ]);
}
```

---

## 📦 Phase 8 : Tests

### Étape 8.1 : Installer le test pack

```bash
composer require --dev symfony/test-pack
```

### Étape 8.2 : Créer un test fonctionnel

**Fichier :** `tests/Controller/Api/TreesControllerTest.php`

```php
<?php

namespace App\Tests\Controller\Api;

use Symfony\Bundle\FrameworkBundle\Test\WebTestCase;

class TreesControllerTest extends WebTestCase
{
    public function testListTrees(): void
    {
        $client = static::createClient();
        $client->request('GET', '/api/trees');

        $this->assertResponseIsSuccessful();
        $this->assertJson($client->getResponse()->getContent());
    }

    public function testCreateTree(): void
    {
        $client = static::createClient();
        $client->request('POST', '/api/trees', [], [], [
            'CONTENT_TYPE' => 'application/json',
        ], json_encode(['name' => 'Test Tree']));

        $this->assertResponseStatusCodeSame(201);
        $this->assertJson($client->getResponse()->getContent());
    }
}
```

### Étape 8.3 : Lancer les tests

```bash
php bin/phpunit
```

---

## 📦 Phase 9 : Qualité de Code

### Étape 9.1 : Installer PHP CS Fixer

```bash
composer require --dev friendsofphp/php-cs-fixer
```

### Étape 9.2 : Créer .php-cs-fixer.php

**Fichier :** `.php-cs-fixer.php`

```php
<?php

$finder = PhpCsFixer\Finder::create()
    ->in(__DIR__)
    ->exclude('var')
    ->exclude('vendor')
    ->exclude('node_modules');

return (new PhpCsFixer\Config())
    ->setRules([
        '@Symfony' => true,
        'array_syntax' => ['syntax' => 'short'],
    ])
    ->setFinder($finder);
```

### Étape 9.3 : Formater le code

```bash
vendor/bin/php-cs-fixer fix
```

---

## 📦 Phase 10 : Documentation API

### Étape 10.1 : Créer README_API.md

**Fichier :** `README_API.md`

````markdown
# API Documentation

## Base URL

`http://127.0.0.1:8000/api`

## Endpoints

### Trees

#### GET /api/trees

Liste tous les trees.

**Query Parameters:**

- `page` (int, optional): Numéro de page (défaut: 1)
- `limit` (int, optional): Nombre d'éléments par page (défaut: 20)

**Response:**

```json
{
    "items": [
        {
            "id": 1,
            "name": "Oak",
            "createdAt": "2024-01-01T00:00:00+00:00"
        }
    ],
    "pagination": {
        "page": 1,
        "limit": 20,
        "total": 1,
        "pages": 1
    }
}
```
````

#### GET /api/trees/{id}

Récupère un tree par ID.

#### POST /api/trees

Crée un nouveau tree.

**Body:**

```json
{
    "name": "Oak"
}
```

#### PUT /api/trees/{id}

Met à jour un tree.

#### DELETE /api/trees/{id}

Supprime un tree.

### Auth

#### GET /api/me

Récupère les informations de l'utilisateur connecté.

**Headers:**

```
Authorization: Bearer <supabase_access_token>
```

**Response:**

```json
{
    "id": "uuid",
    "email": "user@example.com",
    "role": "USER"
}
```

````

---

## ✅ Checklist Finale

- [ ] Entité Tree complète avec name et createdAt
- [ ] Migration créée et appliquée
- [ ] CRUD complet (GET list, GET one, POST, PUT, DELETE)
- [ ] Validation ajoutée
- [ ] Routes testées avec curl
- [ ] Endpoint /api/me créé et protégé
- [ ] ProfileService fonctionnel
- [ ] Fixtures créées et chargées
- [ ] Tests fonctionnels écrits
- [ ] Code formaté avec PHP CS Fixer
- [ ] Documentation API créée

---

## 🚀 Commandes Rapides de Référence

```bash
# Migrations
php bin/console make:migration
php bin/console doctrine:migrations:migrate
php bin/console doctrine:schema:validate

# Routes
php bin/console debug:router | grep api

# Cache
php bin/console cache:clear

# Fixtures
php bin/console doctrine:fixtures:load

# Tests
php bin/phpunit

# Formatage
vendor/bin/php-cs-fixer fix

# Info DB
php bin/console doctrine:database:info
php bin/console doctrine:mapping:info
````

---

## 📝 Notes Importantes

1. **Base de données :** Tu es connecté à `postgres` (base par défaut Supabase). C'est OK pour le dev, mais en prod, crée une DB dédiée.

2. **Schéma :** Les tables sont créées dans le schéma `public` par défaut, ce qui est correct pour Supabase.

3. **Auth :** Le système d'auth Supabase est déjà en place via `SupabaseJwtVerifier` et `AuthListener`. Assure-toi que les routes protégées utilisent `#[IsGranted('ROLE_USER')]`.

4. **CORS :** Déjà configuré avec Nelmio. Vérifie que ton front est autorisé dans `config/packages/nelmio_cors.yaml`.

---

**Bon développement ! 🎉**
