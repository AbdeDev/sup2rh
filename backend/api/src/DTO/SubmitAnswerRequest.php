<?php

namespace App\DTO;

final class SubmitAnswerRequest
{
    public function __construct(
        public readonly string $questionId,
        public readonly ?string $answerId = null,
        public readonly ?string $textValue = null
    ) {}
}
