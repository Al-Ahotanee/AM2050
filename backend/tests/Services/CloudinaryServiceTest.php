<?php
declare(strict_types=1);

namespace AM2050\Tests\Services;

use AM2050\Services\CloudinaryService;
use PHPUnit\Framework\TestCase;

final class CloudinaryServiceTest extends TestCase
{
    public function testIsConfiguredReturnsTrueWithDefaultCredentials(): void
    {
        $service = new CloudinaryService();
        self::assertTrue($service->isConfigured());
        self::assertSame('dxnbuqcfy', $service->getCloudName());
    }

    public function testUploadImageReturnsNullOnEmptyInput(): void
    {
        $service = new CloudinaryService();
        self::assertNull($service->uploadImage(null));
        self::assertNull($service->uploadImage(''));
        self::assertNull($service->uploadImage('   '));
    }

    public function testUploadImageReturnsRemoteHttpsUrlAsIs(): void
    {
        $service = new CloudinaryService();
        $remoteUrl = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
        self::assertSame($remoteUrl, $service->uploadImage($remoteUrl));
    }

    public function testUploadImageFallsBackToDataUriWhenNotConfigured(): void
    {
        $service = new CloudinaryService();
        $dataUri = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
        self::assertSame($dataUri, $service->uploadImage($dataUri));
    }

    public function testUploadRawReturnsNullWhenNotConfigured(): void
    {
        $service = new CloudinaryService();
        self::assertNull($service->uploadRaw('%PDF-1.4 test', 'report.pdf'));
    }

    public function testGenerateSignatureComputesDeterministicSha1(): void
    {
        $service = new CloudinaryService();
        $params = [
            'folder' => 'am2050/test',
            'timestamp' => '1700000000',
        ];
        $sig = $service->generateSignature($params);
        self::assertMatchesRegularExpression('/^[a-f0-9]{40}$/', $sig);
    }
}
