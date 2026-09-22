<?php
declare(strict_types=1);

namespace AM2050\Services;

use AM2050\Core\Env;

/**
 * Service for uploading images, documents, and PDFs to Cloudinary storage buckets.
 * Automatically parses CLOUDINARY_URL or individual CLOUDINARY_* environment variables.
 * Gracefully falls back to raw data if Cloudinary credentials are not configured.
 */
final class CloudinaryService
{
    private ?string $cloudName = null;
    private ?string $apiKey = null;
    private ?string $apiSecret = null;

    public function __construct()
    {
        $url = (string) Env::get('CLOUDINARY_URL', '');
        if ($url !== '') {
            $parsed = parse_url($url);
            if (is_array($parsed)) {
                $this->cloudName = $parsed['host'] ?? null;
                $this->apiKey = $parsed['user'] ?? null;
                $this->apiSecret = $parsed['pass'] ?? null;
            }
        }

        if (!$this->isConfigured()) {
            $this->cloudName = Env::get('CLOUDINARY_CLOUD_NAME') ?: $this->cloudName;
            $this->apiKey = Env::get('CLOUDINARY_API_KEY') ?: $this->apiKey;
            $this->apiSecret = Env::get('CLOUDINARY_API_SECRET') ?: $this->apiSecret;
        }
    }

    public function isConfigured(): bool
    {
        return !empty($this->cloudName) && !empty($this->apiKey) && !empty($this->apiSecret);
    }

    /**
     * Upload an image (base64 data URI or binary) to Cloudinary.
     * Returns Cloudinary secure HTTPS URL or fallback data URI.
     */
    public function uploadImage(?string $dataUriOrBinary, string $folder = 'am2050/general', ?string $publicId = null): ?string
    {
        if ($dataUriOrBinary === null || trim($dataUriOrBinary) === '') {
            return null;
        }

        // If already a Cloudinary or remote HTTPS URL, return as-is
        if (str_starts_with($dataUriOrBinary, 'http://') || str_starts_with($dataUriOrBinary, 'https://')) {
            return $dataUriOrBinary;
        }

        if (!$this->isConfigured()) {
            // Graceful fallback: preserve data URI when credentials are not configured
            return $dataUriOrBinary;
        }

        return $this->performUpload($dataUriOrBinary, 'image', $folder, $publicId);
    }

    /**
     * Upload a raw file (PDF, CSV, etc.) to Cloudinary.
     * Returns Cloudinary secure HTTPS URL or null on failure.
     */
    public function uploadRaw(string $binaryContent, string $filename, string $folder = 'am2050/documents'): ?string
    {
        if (trim($binaryContent) === '') {
            return null;
        }

        if (!$this->isConfigured()) {
            return null;
        }

        $base64 = 'data:application/pdf;base64,' . base64_encode($binaryContent);
        return $this->performUpload($base64, 'raw', $folder, pathinfo($filename, PATHINFO_FILENAME));
    }

    /**
     * Compute Cloudinary SHA-1 signature from sorted parameters.
     */
    public function generateSignature(array $params): string
    {
        ksort($params);
        $pairs = [];
        foreach ($params as $key => $value) {
            if ($value !== null && $value !== '') {
                $pairs[] = "{$key}={$value}";
            }
        }
        $toSign = implode('&', $pairs) . $this->apiSecret;
        return sha1($toSign);
    }

    private function performUpload(string $fileData, string $resourceType, string $folder, ?string $publicId): ?string
    {
        $timestamp = (string) time();
        $params = [
            'folder' => $folder,
            'timestamp' => $timestamp,
        ];
        if ($publicId !== null && $publicId !== '') {
            $params['public_id'] = $publicId;
        }

        $signature = $this->generateSignature($params);

        $postFields = array_merge($params, [
            'api_key' => $this->apiKey,
            'file' => $fileData,
            'signature' => $signature,
        ]);

        $apiUrl = "https://api.cloudinary.com/v1_1/{$this->cloudName}/{$resourceType}/upload";

        $response = $this->executeHttp($apiUrl, $postFields);
        if ($response === null) {
            return str_starts_with($fileData, 'data:') ? $fileData : null;
        }

        $data = json_decode($response, true);
        if (!is_array($data) || empty($data['secure_url'])) {
            error_log('Cloudinary upload error: ' . ($data['error']['message'] ?? 'Unknown error'));
            return str_starts_with($fileData, 'data:') ? $fileData : null;
        }

        return (string) $data['secure_url'];
    }

    private function executeHttp(string $url, array $postFields): ?string
    {
        if (function_exists('curl_init')) {
            $ch = curl_init($url);
            curl_setopt_array($ch, [
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => $postFields,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 25,
                CURLOPT_SSL_VERIFYPEER => true,
            ]);
            $output = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);
            if ($httpCode >= 200 && $httpCode < 300 && is_string($output)) {
                return $output;
            }
            return null;
        }

        // Fallback to PHP streams if cURL extension is unavailable
        $boundary = '--------------------------' . bin2hex(random_bytes(16));
        $body = '';
        foreach ($postFields as $name => $value) {
            $body .= "--{$boundary}\r\n";
            $body .= "Content-Disposition: form-data; name=\"{$name}\"\r\n\r\n";
            $body .= "{$value}\r\n";
        }
        $body .= "--{$boundary}--\r\n";

        $context = stream_context_create([
            'http' => [
                'method' => 'POST',
                'header' => "Content-Type: multipart/form-data; boundary={$boundary}\r\n" .
                            "Content-Length: " . strlen($body) . "\r\n",
                'content' => $body,
                'timeout' => 25,
                'ignore_errors' => true,
            ],
        ]);

        $res = @file_get_contents($url, false, $context);
        return is_string($res) ? $res : null;
    }
}
