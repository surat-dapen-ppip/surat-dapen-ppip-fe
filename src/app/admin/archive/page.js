import { Suspense } from 'react';
import ArchivePageClient from './ArchivePageClient';

export default function ArchivePage() {
    return (
        <Suspense fallback={<div className="min-h-[200px] flex items-center justify-center text-sm text-gray-500">Memuat arsip...</div>}>
            <ArchivePageClient />
        </Suspense>
    );
}

