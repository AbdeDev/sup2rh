<?php

namespace App\DTO;

final class AnalysisResult
{
    public function __construct(
        public readonly string $jobId,
        public readonly float $confidence,
        public readonly string $explanation,
        public readonly array $scores = []
    ) {}
}
