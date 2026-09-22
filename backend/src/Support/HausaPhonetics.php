<?php
declare(strict_types=1);

namespace AM2050\Support;

final class HausaPhonetics
{
    private const TITLES = [
        'mallam', 'mal.', 'mal', 'sheikh', 'sheik', 'alhaji', 'alh.', 'alh',
        'gidan', 'mai-', 'mai', 'baba', 'hajiya', 'haj.', 'haj',
    ];

    private const CANONICAL_MAP = [
        // Muhammadu variants
        'mohd' => 'muhammadu',
        'moh\'d' => 'muhammadu',
        'mahamadou' => 'muhammadu',
        'mamman' => 'muhammadu',
        'muhammad' => 'muhammadu',
        'mohammed' => 'muhammadu',
        'muhammed' => 'muhammadu',
        'muhamadu' => 'muhammadu',

        // Abubakar variants
        'garba' => 'abubakar',
        'bukar' => 'abubakar',
        'buba' => 'abubakar',
        'abubakr' => 'abubakar',
        'abubakar' => 'abubakar',

        // Ibrahim variants
        'barau' => 'ibrahim',
        'ibraheem' => 'ibrahim',
        'ibro' => 'ibrahim',
        'ibrahima' => 'ibrahim',

        // Fatima variants
        'fatsuma' => 'fatima',
        'umma' => 'fatima',
        'fatimah' => 'fatima',
        'fatimatu' => 'fatima',

        // Danladi / Danlami / Danazumi
        'danladi' => 'danladi',
        'ladi' => 'danladi',
        'danlami' => 'danlami',
        'lami' => 'danlami',
        'danazumi' => 'danazumi',
        'azumi' => 'danazumi',

        // Lawan / Lawal
        'lawal' => 'lawan',
        'lawali' => 'lawan',
        'lawandi' => 'lawan',

        // Sanusi / Sunusi
        'sunusi' => 'sanusi',

        // Ismail / Ismaila
        'ismail' => 'ismaila',
        'smaila' => 'ismaila',
        'isma\'ila' => 'ismaila',
        'ismailu' => 'ismaila',

        // Usman variants
        'uthman' => 'usman',
        'osman' => 'usman',
        'ousmane' => 'usman',

        // Haruna variants
        'harun' => 'haruna',
        'aruna' => 'haruna',

        // Yusuf variants
        'yusufa' => 'yusuf',
        'issoufou' => 'yusuf',
        'yusif' => 'yusuf',

        // Kabiru / Salisu / Mustapha
        'kabir' => 'kabiru',
        'sale' => 'salisu',
        'saley' => 'salisu',
        'mustafa' => 'mustapha',
        'moustapha' => 'mustapha',
        'bello' => 'bello',
        'ballo' => 'bello',
        'shehu' => 'shehu',
        'shahu' => 'shehu',
    ];

    /**
     * Clean and normalize a Northern Nigerian name.
     */
    public static function normalize(string $name): string
    {
        $clean = mb_strtolower(trim($name), 'UTF-8');
        // Remove apostrophes, hyphens, punctuation
        $clean = preg_replace('/[^\p{L}\s]/u', '', $clean) ?? '';
        $tokens = preg_split('/\s+/', $clean, -1, PREG_SPLIT_NO_EMPTY) ?: [];

        $filtered = [];
        foreach ($tokens as $token) {
            if (in_array($token, self::TITLES, true)) {
                continue;
            }
            $canonical = self::CANONICAL_MAP[$token] ?? $token;
            $filtered[] = $canonical;
        }

        return implode(' ', $filtered);
    }

    /**
     * Return phonetic Soundex key for normalized name.
     */
    public static function soundexKey(string $name): string
    {
        $normalized = self::normalize($name);
        $parts = explode(' ', $normalized);
        $keys = array_map('soundex', $parts);
        return implode('-', $keys);
    }

    /**
     * Return phonetic Metaphone key for normalized name.
     */
    public static function metaphoneKey(string $name): string
    {
        $normalized = self::normalize($name);
        $parts = explode(' ', $normalized);
        $keys = array_map('metaphone', $parts);
        return implode('-', $keys);
    }

    /**
     * Calculate phonetic similarity between two names (0.0 to 1.0).
     */
    public static function similarity(string $name1, string $name2): float
    {
        $norm1 = self::normalize($name1);
        $norm2 = self::normalize($name2);

        if ($norm1 === '' || $norm2 === '') {
            return 0.0;
        }

        if ($norm1 === $norm2) {
            return 1.0;
        }

        // Check metaphone match
        $meta1 = self::metaphoneKey($name1);
        $meta2 = self::metaphoneKey($name2);
        if ($meta1 !== '' && $meta1 === $meta2) {
            return 0.95;
        }

        // Check soundex match
        $sound1 = self::soundexKey($name1);
        $sound2 = self::soundexKey($name2);
        if ($sound1 !== '' && $sound1 === $sound2) {
            return 0.85;
        }

        similar_text($norm1, $norm2, $percent);
        return round($percent / 100, 2);
    }
}
