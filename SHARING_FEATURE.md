# Fitur Bagikan Pembelajaran (Course Sharing)

## Deskripsi
Fitur ini memungkinkan pengguna (instructor/admin) untuk membagikan halaman CoursePlayer ke publik dengan hanya memberikan akses preview read-only. Pengunjung publik tidak perlu login dan hanya dapat menonton/membaca konten, tanpa akses ke fitur lainnya.

## Komponen yang Ditambahkan

### 1. **ShareModal.tsx**
Modal dialog untuk mengelola dan membuat share link

**Features:**
- 2 tab mode: "Link Publik Langsung" dan "Link dengan Token"
- Link Publik Langsung: Share link langsung tanpa token
- Link dengan Token: Generate token yang dapat dikelola (buat/hapus) dengan ekspirasi 30 hari
- Copy to clipboard functionality
- Tampilan token yang sudah dibuat dengan status ekspirasi

### 2. **PublicCoursePreview.tsx**
Halaman view khusus untuk preview publik

**Features:**
- Read-only mode - tidak ada tombol edit atau delete
- Menampilkan indikator "Preview Publik" di header
- Sidebar daftar materi untuk navigasi
- Player video YouTube
- Deskripsi materi
- Info author
- Mobile-responsive layout
- Tombol kembali ke home

### 3. **shareUtils.ts**
Utility functions untuk mengelola share token

**Functions:**
- `generateShareToken()` - Generate token baru dengan ekspirasi 30 hari
- `validateShareToken()` - Validasi token dan check expiration
- `generateShareLink()` - Generate share link dari token
- `getShareTokenFromUrl()` - Extract share token dari URL
- `isPublicShare()` - Check apakah current page adalah public share
- `getPublicCourseParams()` - Extract public course params dari URL
- `isPublicPreview()` - Check apakah current page adalah public preview

## Perubahan pada File Existing

### App.tsx
- Import komponen baru: `PublicCoursePreview`
- Tambah view type: `'public-preview'`
- Update routing logic untuk detect `?publicCourse=ID&publicLesson=ID` URL params
- Add render untuk public-preview view

### CoursePlayer.tsx
- Import `ShareModal` 
- Replace old share modal dengan komponen `ShareModal`
- Tambah state untuk `showShareModal`

## Cara Penggunaan

### Untuk Instructor/Admin:
1. Buka halaman CoursePlayer
2. Klik tombol "Bagikan" di header
3. Pilih tab yang diinginkan:
   - **Link Publik Langsung**: Langsung bagikan link tanpa token management
   - **Link dengan Token**: Generate token baru, manage token yang ada (hapus/check expiry)
4. Copy link dan bagikan ke orang lain

### Untuk Pengunjung Publik:
1. Klik atau buka link yang dibagikan
2. Halaman terbuka langsung ke PublicCoursePreview tanpa login
3. Dapat:
   - Menonton video
   - Membaca deskripsi
   - Navigasi antar materi
4. Tidak dapat:
   - Edit atau delete konten
   - Akses admin panel
   - Download materi pendukung (read-only view)

## URL Format

### Public Preview Link (Langsung):
```
https://example.com/?publicCourse={courseId}&publicLesson={lessonId}
```

### Public Share Link (Dengan Token):
```
https://example.com/?share={shareToken}
```

## Storage
- Share tokens disimpan di `localStorage` dengan key: `share_tokens`
- Tokens adalah array dari objek `ShareToken`:
  ```typescript
  interface ShareToken {
    courseId: string;
    lessonId?: string;
    token: string;
    createdAt: number;
    expiresAt?: number;
  }
  ```

## Security Notes
- Token digenerate secara random dengan timestamp
- Token memiliki ekspirasi otomatis (30 hari)
- Public preview hanya memberikan akses read-only
- Tidak ada authenticati yang diperlukan untuk akses publik
- Data masih tersimpan di localStorage browser (silakan upgrade ke backend storage jika diperlukan)

## Future Enhancements
- Backend storage untuk token management
- Analytics tracking untuk share links
- Password-protected share links
- Custom expiration time untuk tokens
- Track view analytics per share link
- Limit akses publik berdasarkan role/permission
