#!/bin/bash

echo "🚀 Démarrage du backend Symfony..."

cd backend/api

# Vérifier si Symfony CLI est installé
if command -v symfony &> /dev/null; then
    echo "✅ Utilisation de Symfony CLI"
    symfony serve -d
    echo "✅ Backend démarré sur http://127.0.0.1:8000"
else
    echo "⚠️  Symfony CLI non trouvé, utilisation de PHP built-in server"
    php -S 127.0.0.1:8000 -t public &
    echo "✅ Backend démarré sur http://127.0.0.1:8000"
fi

# Attendre un peu pour que le serveur démarre
sleep 2

# Tester la connexion
echo ""
echo "🧪 Test de connexion..."
if curl -s http://127.0.0.1:8000/api/health > /dev/null; then
    echo "✅ Backend répond correctement!"
else
    echo "❌ Le backend ne répond pas. Vérifiez les logs."
fi

echo ""
echo "📝 Pour arrêter le serveur:"
echo "   - Symfony CLI: symfony server:stop"
echo "   - PHP built-in: killall php"
