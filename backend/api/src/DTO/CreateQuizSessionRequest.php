<?php

namespace App\DTO;

final class CreateQuizSessionRequest
{
    public function __construct(
        public readonly string $userId
    ) {}
}
