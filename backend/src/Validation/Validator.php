<?php
declare(strict_types=1);

namespace AM2050\Validation;

use InvalidArgumentException;

final class Validator
{
    /** @return array<string,mixed> */
    public static function allow(array $input, array $rules, bool $partial = false): array
    {
        $clean = [];
        $errors = [];
        foreach ($rules as $field => $rule) {
            $present = array_key_exists($field, $input);
            if (!$present && !$partial && ($rule['required'] ?? false)) {
                $errors[$field] = 'This field is required.';
                continue;
            }
            if (!$present) {
                continue;
            }
            $value = $input[$field];
            if ($value === null && ($rule['nullable'] ?? false)) {
                $clean[$field] = null;
                continue;
            }
            if (($rule['type'] ?? null) === 'string') {
                if (!is_string($value)) { $errors[$field] = 'Must be a string.'; continue; }
                $value = trim($value);
                if (($rule['required'] ?? false) && $value === '') { $errors[$field] = 'This field is required.'; continue; }
                if (isset($rule['max']) && mb_strlen($value) > $rule['max']) { $errors[$field] = "Must not exceed {$rule['max']} characters."; continue; }
            }
            if (($rule['type'] ?? null) === 'bool' && !is_bool($value)) { $errors[$field] = 'Must be true or false.'; continue; }
            if (($rule['type'] ?? null) === 'number' && !is_numeric($value)) { $errors[$field] = 'Must be numeric.'; continue; }
            if (isset($rule['in']) && !in_array($value, $rule['in'], true)) { $errors[$field] = 'Contains an unsupported value.'; continue; }
            $clean[$field] = $value;
        }
        if ($errors !== []) {
            throw new InvalidArgumentException(json_encode($errors, JSON_THROW_ON_ERROR));
        }
        return $clean;
    }

    public static function page(array $query): array
    {
        $page = max(1, (int) ($query['page'] ?? 1));
        $limit = min(500, max(1, (int) ($query['limit'] ?? 25)));
        return [$page, $limit, ($page - 1) * $limit];
    }
}
