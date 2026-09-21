# Panduan Taliabu Environmental Monitor

Panduan ini menjelaskan cara menggunakan peta, memilih layer, membaca metrik, membandingkan scene, meninjau alert, dan mempertahankan bukti. Panduan ini juga menjelaskan sumber data, perhitungan, asumsi, serta batasan di balik hasilnya. Struktur heading-nya menjadi navigasi dalam panel Guide.

## Mulai dari peta

Peta adalah ruang kerja utama. Gunakan basemap untuk memahami area, lalu aktifkan layer yang diperlukan untuk menjawab pertanyaan analisis.

### Navigasi peta

- Gunakan zoom dan pan untuk berpindah di area tersebut.
- Klik fitur peta untuk melihat detailnya di Inspector.
- Gunakan **Draw AOI** untuk menguraikan area yang ingin dianalisis.

### Kontrol peta

- Gunakan **+** dan **-** untuk mengubah zoom.
- Gunakan **Reset to Taliabu extent** untuk kembali ke tampilan peta default.
- Gunakan **Locate me** ketika browser dapat menyediakan lokasi Anda.
- Gunakan kontrol atribusi untuk menampilkan atau menyembunyikan atribusi peta.

## Alur kerja observasi

Gunakan aplikasi untuk menyaring suatu tempat, membandingkan observasi, dan menentukan hal yang memerlukan peninjauan lebih dekat. Aplikasi tidak secara mandiri mengonfirmasi suatu peristiwa, penyebabnya, atau status hukumnya.

### Mulai dengan pertanyaan observasi

Tulis pertanyaan sebelum memilih layer atau metrik. Kaitkan pertanyaan dengan hal yang dapat diamati aplikasi:

- **Perubahan permukaan**: Di mana kehilangan vegetasi atau lahan terbuka baru muncul di antara dua jendela perbandingan?
- **Konteks pertambangan**: Apakah perubahan yang terdeteksi berada di dalam atau di luar IUP yang diketahui, dan data referensi apa yang tersedia untuk lokasi tersebut?
- **Hidrologi**: Apakah perubahan berada dekat sungai yang dipetakan, di dalam daerah aliran sungai, atau terhubung ke outlet hilir yang dimodelkan?
- **Konteks pesisir atau air**: Apakah ada pola area air, garis pantai, atau proksi kekeruhan yang terlihat di dekat outlet sungai atau pantai?
- **Waktu dan bukti**: Apakah pola tetap terlihat pada citra sumber dan pasangan tanggal lain yang dapat digunakan?

Pertanyaan seperti "Apakah aktivitas ini ilegal?", "Apa yang menyebabkan perubahan?", atau "Apakah air tercemar?" memerlukan catatan, bukti lapangan, atau pengukuran di luar aplikasi ini.

### Pilih cakupan observasi

Pilih cakupan terkecil yang menjawab pertanyaan:

1. Gunakan **Viewport** untuk pemindaian visual cepat pada tampilan peta saat ini.
2. Gambar **AOI** untuk observasi berulang yang terkait dengan poligon tertentu.
3. Gunakan **Permit** untuk memeriksa fitur izin yang dipilih beserta konteks di sekitarnya.
4. Gunakan **Island** untuk latar belakang luas, bukan untuk menilai lokasi kecil.

Pertahankan cakupan yang sama saat membandingkan tanggal. Viewport dapat berubah ketika Anda melakukan pan atau zoom, sedangkan AOI tetap terkait dengan poligon yang Anda gambar.

### Periksa lokasi sebelum membaca metrik

1. Mulai dengan konteks basemap **Satellite** atau **Vector**.
2. Aktifkan hanya layer yang terkait dengan pertanyaan.
3. Periksa sungai terdekat, garis pantai, permukiman, terrain, izin, dan batas daerah aliran sungai ketika memberikan konteks yang relevan.
4. Buka Inspector untuk fitur atau AOI, lalu catat luas, lokasi, dan metadata referensi yang tersedia.

Layer referensi menyediakan konteks spasial. Fitur yang dipetakan dapat tidak lengkap atau sudah kedaluwarsa, dan kedekatan tidak menetapkan penyebab.

### Sesuaikan observasi dengan pertanyaan produk

Gunakan jalur berikut untuk pertanyaan utama dalam aplikasi ini:

#### Gangguan permukaan baru

1. Gambar AOI di sekitar area yang dicurigai.
2. Bandingkan periode lebih awal dan lebih akhir dengan **Vegetation loss** atau **New bare land**.
3. Periksa pixel yang disorot dalam tampilan true color, false color, vegetasi, dan tanah terbuka.
4. Periksa batas IUP yang diketahui, sungai terdekat, daerah aliran sungai, kemiringan, dan konteks permukiman.
5. Catat luas perubahan dan indikator kualitas sebagai bukti penyaringan, bukan sebagai jejak tambang yang terukur.

#### Hubungan dengan area pertambangan

1. Pilih atau gambar area yang diminati.
2. Aktifkan layer **Mining** atau **Mining Impact**.
3. Bandingkan perubahan yang terdeteksi dengan poligon IUP yang diketahui.
4. Baca **inside known IUP**, **outside known IUP**, atau konteks yang hilang hanya sebagai hubungan spasial.
5. Periksa metadata izin dan informasi pengambilannya sebelum melaporkan hasil.

Area di luar layer IUP yang diketahui berarti tidak ada irisan dengan data izin yang tersedia bagi aplikasi. Hal itu tidak membuktikan bahwa izin tidak ada atau aktivitas tersebut ilegal.

#### Konteks sungai, daerah aliran sungai, dan hilir

1. Aktifkan layer sungai, daerah aliran sungai, terrain, dan outlet sungai.
2. Gunakan Inspector untuk memeriksa jarak ke sungai terdekat, daerah aliran sungai, kemiringan, dan outlet hilir jika tersedia.
3. Bandingkan lokasi perubahan yang terdeteksi dengan konteks drainase yang dimodelkan.
4. Gunakan hasilnya untuk menentukan lokasi yang mungkin berguna bagi citra hilir atau pemeriksaan lapangan.
5. Klik outlet sungai untuk melihat luas daerah tangkapan yang dimodelkan, IUP terdekat yang diketahui, dan jaraknya ke boundary IUP saat ini.

Jalur hilir adalah alat bantu orientasi yang dimodelkan. Jalur ini tidak membuktikan bahwa sedimen, polusi, atau material lain bergerak dari area yang berubah.

#### Pola pesisir atau air

1. Bandingkan layer air atau garis pantai yang dipilih untuk dua periode yang dapat digunakan.
2. Gunakan **Water change** untuk pixel yang melintasi ambang MNDWI.
3. Gunakan tepi air scene dan garis pantai baseline untuk memeriksa konteks garis pantai.
4. Gunakan **Turbidity (NDTI)** di dekat outlet sungai atau pantai hanya sebagai proksi sedimen atau reflektansi air.
5. Periksa curah hujan, pasang, masking awan, citra sumber, dan pasangan tanggal lain jika tersedia.

Layer ini dapat menunjukkan pola spasial yang patut ditinjau. Layer ini tidak dapat menetapkan kimia air, polusi, pembuangan, atau penyebab perubahan garis pantai.

### Ukur cakupan yang dipilih

Jalankan Land Cover untuk tanggal dan cakupan yang dipilih. Catat vegetation, bare / sparse, water, scope area, dan cloud-free coverage. Baca nilainya sebagai estimasi pixel berbasis ambang untuk jendela tanggal tersebut, bukan sebagai inventaris lapangan.

Jika pertanyaannya tentang perubahan, gunakan Change Detection, bukan membandingkan dua tangkapan layar Land Cover yang tidak berkaitan:

1. Gambar atau gunakan kembali AOI.
2. Pilih **Vegetation loss**, **New bare land**, atau **Water change**.
3. Atur tanggal lebih awal dan lebih akhir.
4. Jalankan analisis.
5. Catat metode, luas perubahan, jendela tanggal, cloud-free coverage, dan sumber.

### Periksa bukti sebelum membuat pernyataan

Tinjau pixel yang disorot terhadap citra true-color, false-color, dan layer referensi yang relevan. Kemudian periksa apakah hasilnya luas dan konsisten atau terisolasi serta dekat dengan resolusi raster. Ulangi observasi penting dengan pasangan tanggal lain yang dapat digunakan bila memungkinkan.

Gunakan kata-kata yang sesuai dengan bukti:

> AOI yang dipilih berisi pixel yang memenuhi aturan kehilangan vegetasi di antara dua jendela perbandingan.

Hindari kata-kata yang mengklaim lebih dari yang diukur aplikasi:

> Aplikasi membuktikan bahwa penambangan ilegal terjadi.

Kalimat pertama menjelaskan hasil indeks. Kalimat kedua mengklaim penyebab dan status hukum yang tidak dapat ditetapkan aplikasi.

### Catat observasi

Untuk catatan yang berguna, simpan AOI atau lokasi peta, jenis cakupan, pertanyaan observasi, layer aktif, tanggal atau pasangan tanggal, metode, nilai metrik, cloud-free coverage, sumber, export, dan catatan tentang hal yang masih tidak pasti. Simpan alert hanya ketika hasil memenuhi aturan alert yang dikonfigurasi dan buktinya telah ditinjau.

## Layers

Panel Layers mengendalikan basemap dan layer referensi. Setiap layer memiliki kategori dan status visibilitas. Layer raster juga dapat memiliki kontrol opacity.

### Basemap

Pilih **Vector** untuk batas dan label, **Satellite** untuk citra, atau **Minimal** ketika layer tematik harus tetap menjadi fokus.

### Layer tematik

Aktifkan hanya layer yang membantu menjawab pertanyaan saat ini. Warna kategori konsisten pada layer lingkungan, pertambangan, hidrologi, pesisir, terrain, dan satelit.

### Slider opacity layer

Slider opacity layer mengubah seberapa kuat overlay yang terlihat muncul pada peta. Ini adalah kontrol perbandingan visual, bukan kontrol analisis.

1. Aktifkan layer.
2. Klik nama layer untuk membuka deskripsi dan legendanya.
3. Geser slider **opacity** untuk membandingkan layer dengan basemap dan layer lain yang terlihat.
4. Baca persentase di samping slider sebagai opacity tampilan, dari `0%` transparan hingga `100%` terlihat penuh.

Slider tidak mengubah Land Cover, Change Detection, threshold Alert, cloud-free coverage, perhitungan luas, atau nilai metrik yang diekspor. Layer dapat terlihat samar tetapi tetap aktif di peta, dan mengubah opacity tidak menjalankan ulang analisis.

Gunakan opacity sesuai pertanyaan:

- **Citra Satellite**: turunkan overlay untuk melihat permukaan di bawahnya; naikkan ketika pola tematik menjadi subjek utama.
- **NDVI atau indeks lain**: turunkan indeks untuk membandingkan polanya dengan citra true-color; naikkan untuk memeriksa kesinambungan spasial sinyal indeks.
- **Batas izin**: turunkan isian ketika memeriksa permukaan di dalam IUP; naikkan batas ketika memeriksa apakah pola terdeteksi melintasi tepi izin.
- **Sungai dan batas daerah aliran sungai**: turunkan isian dan garis ketika mencari perubahan; naikkan ketika memeriksa jarak sungai atau daerah tangkapan yang berisi AOI.
- **Garis pantai dan tepi air scene**: turunkan satu garis pada satu waktu ketika membandingkan baseline dengan scene terpilih; jangan menganggap tumpang tindih garis saja sebagai perubahan garis pantai yang terukur.
- **Proksi kekeruhan atau raster lain**: turunkan proksi agar outlet sungai atau garis pantai tetap terlihat; naikkan hanya setelah memeriksa citra sumber dan legenda.
- **Layer permukiman dan terrain**: turunkan layer konteks ketika memeriksa perubahan itu sendiri; naikkan ketika memeriksa kedekatan atau kondisi bentang alam.

Jangan gunakan opacity untuk membuat pola lemah tampak lebih kuat. Ketika hasil sulit dilihat, periksa legenda layer, tanggal scene, cloud-free coverage, dan citra sumber sebelum mengubah interpretasi.

### Kelompok layer

- **Environment** mencakup klasifikasi scene serta indeks vegetasi atau air. NDVI adalah proksi vegetasi. NDWI dan MNDWI adalah proksi yang berkaitan dengan air.
- **Mining** mencakup batas izin. Gunakan sebagai konteks spasial saat meninjau perubahan, bukan sebagai bukti aktivitas atau kepatuhan.
- **Hydrology** mencakup sungai, batas daerah aliran sungai, serta layer drainase atau daerah tangkapan turunan.
- **Coastal** mencakup garis pantai, tepi air scene, proksi kekeruhan, dan outlet sungai.
- **Terrain** mencakup permukiman, area permukiman, elevasi, dan kemiringan.
- **Satellite** mencakup citra scene optik dan ketersediaan SAR. SAR dapat membantu memberi konteks ketika citra optik terpengaruh awan.

### Mining Impact mode

Mining Impact mode adalah preset peta untuk meninjau kemungkinan perubahan permukaan dalam kaitannya dengan konteks pertambangan dan lingkungan. Mode ini beralih ke basemap satelit dan hanya mengaktifkan layer berikut:

- **Permit boundaries**: poligon IUP yang diketahui dari catatan BIG Kebijakan Satu Peta.
- **NDVI**: indeks vegetasi turunan scene untuk melihat pola vegetasi.
- **Rivers & watershed**: garis sungai yang dipetakan untuk konteks spasial dan analisis sungai terdekat.
- **Watershed boundaries**: konteks daerah tangkapan untuk area yang terlihat.
- **Coastline**: garis pantai baseline yang digunakan untuk konteks pesisir dan analisis jarak.
- **Settlement areas**: konteks permukiman di sekitar kemungkinan perubahan.

Mode ini tidak menghitung skor mining-impact, mengidentifikasi tambang secara otomatis, menjalankan Change Detection, atau membuat alert. Mode ini hanya mengubah basemap dan visibilitas layer agar konteks yang relevan terlihat bersama.

### Cara membaca Mining Impact mode

Gunakan mode dalam urutan ini:

1. Lihat basemap satelit untuk tanah terbuka yang terlihat, pola vegetasi, jalan, air, atau konteks permukaan lain.
2. Bandingkan pola yang terlihat dengan layer NDVI. Pola vegetasi rendah adalah sinyal penyaringan, bukan jejak tambang yang terkonfirmasi.
3. Periksa apakah pola bertumpang tindih dengan batas izin yang diketahui. Baca batas tersebut sebagai perbandingan dengan data izin yang tersedia, bukan sebagai bukti aktivitas atau otorisasi saat ini.
4. Periksa layer sungai terdekat, daerah aliran sungai, garis pantai, dan permukiman. Layer ini menunjukkan fitur lingkungan atau komunitas mana yang mungkin perlu ditinjau lebih dekat.
5. Gambar AOI di sekitar pola tertentu lalu jalankan Land Cover atau Change Detection. Mode itu sendiri bukan hasil analisis.
6. Catat tanggal citra, cakupan, metrik, cloud-free coverage, sumber, dan konteks yang relevan sebelum melaporkan observasi.

Sebagai contoh, berikut pembacaan yang sesuai:

> Pola vegetasi rendah terlihat pada scene yang dipilih, berada di dalam IUP yang diketahui dan dekat dengan sungai yang dipetakan. Analisis AOI lebih lanjut diperlukan untuk menguji apakah pola berubah di antara jendela observasi yang dapat digunakan.

Hal ini tidak didukung oleh mode tersebut saja:

> Mining Impact mode membuktikan bahwa penambangan ilegal sedang berlangsung dan mencemari sungai.

Pernyataan pertama memisahkan hal yang ditunjukkan peta dari hal yang masih memerlukan analisis. Pernyataan kedua mengklaim aktivitas, legalitas, dan polusi yang tidak dapat ditetapkan preset ini. Menonaktifkan mode mengembalikan visibilitas default setiap layer, bukan selalu status visibilitas khusus sebelum mode diaktifkan.

### Hal yang dibaca pertama dalam Mining Impact mode

Baca layer peta aktif dalam urutan ini. Setiap layer menjawab pertanyaan konteks yang berbeda:

1. **Satellite basemap**: baca pola permukaan yang terlihat: vegetasi, tanah terbuka, jalan, air, atau area permukiman. Ini tidak menetapkan penyebab atau tanggal pola.
2. **NDVI**: baca lokasi vegetasi tampak lebih kuat atau lebih lemah pada scene yang dipilih. Ini tidak membuktikan kualitas hutan, pembukaan lahan, atau pertambangan dengan sendirinya.
3. **Permit boundaries**: baca apakah pola yang terlihat bertumpang tindih dengan poligon IUP yang diketahui. Ini tidak membuktikan pertambangan aktif, berizin, ilegal, atau bertanggung jawab atas pola tersebut.
4. **Rivers and watershed**: baca apakah pola dekat sungai yang dipetakan dan daerah aliran sungai yang memuatnya. Ini tidak membuktikan bahwa material atau polusi mengalir melalui sungai.
5. **Coastline**: baca apakah pola dekat garis pantai baseline. Ini tidak membuktikan perubahan garis pantai, erosi, pembuangan, atau dampak pesisir.
6. **Settlement areas**: baca apakah pola dekat area permukiman yang dipetakan. Ini tidak membuktikan paparan aktual, dampak terhadap penduduk, atau kerugian komunitas.

Pembacaan praktisnya adalah hubungan, bukan putusan. Contohnya: **pola vegetasi rendah terlihat pada scene yang dipilih, bertumpang tindih dengan IUP yang diketahui, dan berada dekat sungai yang dipetakan dalam satu daerah aliran sungai**. Observasi tersebut memberi tahu Anda tempat menggambar AOI dan hal yang perlu diselidiki berikutnya. Observasi itu tidak mengatakan bahwa pertambangan menyebabkan pola atau sungai terdampak.

Setelah membaca layer ini, gunakan Inspector untuk menggambar AOI dan memeriksa luas, irisan izin, sungai terdekat, daerah aliran sungai, jarak ke pantai, jarak ke permukiman, kemiringan, dan outlet hilir bila tersedia. Kemudian jalankan Change Detection untuk menguji apakah pola yang dicurigai berubah di antara dua jendela observasi. Metrik Inspector dan hasil perubahan adalah bukti yang perlu dibaca berikutnya; layer preset hanya menyediakan konteks spasial.

### Menggunakan slider dalam Mining Impact mode

Mining Impact mode mengaktifkan layer konteks yang relevan, tetapi tidak memilih opacity terbaik untuk setiap observasi. Gunakan slider untuk menampilkan hubungan yang sedang diperiksa:

- Turunkan **NDVI** ketika membandingkan pola vegetasi dengan basemap satelit.
- Turunkan **Permit boundaries** ketika memeriksa permukaan di dalam izin, lalu naikkan batas untuk memeriksa tepi izin.
- Turunkan **Rivers and watershed boundaries** ketika mencari gangguan, lalu naikkan untuk memeriksa konteks lingkungannya.
- Turunkan **Coastline** atau **Settlement areas** ketika keduanya menutupi pola yang sedang diperiksa.

Kekuatan warna atau batas yang terlihat bukan nilai metrik. Catat nama layer dan tanggal scene, bukan persentase slider, sebagai bagian dari bukti observasi. Persentase slider mungkin membantu seseorang mereproduksi tangkapan layar, tetapi tidak mengubah hasil.

## Inspector

Inspector menampilkan detail fitur atau area yang dipilih. Untuk AOI, jalankan analisis tutupan lahan dan periksa sumber, tanggal scene, cakupan awan, serta konteks izin.

### Quick Stats

Quick Stats merangkum tampilan peta saat ini. Quick Stats menampilkan layer aktif dan fitur yang terlihat ketika nilainya tersedia. Ini adalah ringkasan tampilan, bukan pengukuran AOI.

### Analisis AOI

1. Gambar AOI pada peta.
2. Tunggu hingga metrik area selesai dihitung.
3. Periksa vegetation, bare/sparse, water, scope area, dan nilai cloud-free.
4. Gunakan **Clear AOI** sebelum membuat area baru.

### Metrik tutupan lahan

Panel Land cover melaporkan vegetasi, lahan terbuka atau jarang, air, total luas cakupan, dan cloud-free coverage. Ini adalah estimasi satelit kasar dari tanggal dan cakupan yang dipilih. Hasilnya berguna untuk penyaringan dan perbandingan, bukan untuk menggantikan survei lapangan atau peta tutupan lahan resmi.

Pemilih cakupan mengubah area yang diringkas:

- **Island** menganalisis batas pulau Taliabu.
- **Viewport** menganalisis tampilan peta saat ini.
- **AOI** menganalisis poligon yang Anda gambar.
- **Permit** menganalisis fitur izin yang dipilih ketika salah satunya dipilih.

Gunakan cakupan yang sesuai dengan pertanyaan. Hasil viewport berubah ketika Anda melakukan pan atau zoom, sedangkan hasil AOI tetap terkait dengan poligon yang digambar. Opsi Permit tersedia setelah memilih fitur izin pertambangan.

### Hal yang diukur panel

Panel tidak mengidentifikasi setiap kelas tutupan lahan. Panel membagi pixel valid menjadi tiga kelompok luas:

- **Vegetation**: pixel dengan NDVI lebih besar dari `0.2`, kecuali pixel yang sama lebih dahulu diklasifikasikan sebagai water.
- **Bare / sparse**: pixel valid yang bukan water dan memiliki NDVI kurang dari atau sama dengan `0.2`.
- **Water**: pixel dengan MNDWI lebih besar dari `0.1`. Water diuji lebih dahulu, sehingga pixel yang memenuhi kedua threshold dihitung sebagai water.

Bare / sparse adalah kelompok residual. Kelompok ini dapat mencakup tanah terbuka, batu, pasir, permukaan terbangun, vegetasi jarang, bayangan, atau pixel lain dengan NDVI rendah. Kelompok ini bukan klasifikasi geologi, permukiman, atau pertambangan formal.

### Vegetasi

Vegetasi diestimasi dengan Normalized Difference Vegetation Index, atau NDVI. Perhitungan menggunakan reflektansi merah Sentinel-2 L2A dari band B04 dan reflektansi inframerah-dekat dari band B08:

```text
NDVI = (B08 - B04) / (B08 + B04)
```

Aplikasi menghitung pixel valid sebagai vegetasi ketika `NDVI > 0.2`. NDVI yang lebih tinggi umumnya menunjukkan reflektansi vegetasi hijau yang lebih kuat, tetapi nilainya dipengaruhi jenis tanaman, kepadatan, kelembapan, musim, bayangan, atmosfer, dan pencampuran pixel.

Luas vegetasi yang tinggi berarti lebih banyak area pixel yang dianalisis melewati threshold ini pada komposit satelit yang dipilih. Hal ini sendiri tidak membuktikan hutan utuh, kondisi ekologis yang baik, penggunaan lahan legal, atau tidak adanya pertambangan.

### Bare / sparse

Bare / sparse dihitung setelah water dan vegetation dihapus dari pixel valid. Dalam kode, artinya:

```text
valid pixel AND MNDWI <= 0.1 AND NDVI <= 0.2
```

Kategori ini sengaja luas. Nilai tinggi dapat mencerminkan tanah terbuka, jalan, atap, batu, pasir, vegetasi jarang, atau bayangan. Gunakan layer true-color, false-color, dan bare-soil untuk memeriksa peta sebelum menafsirkan perubahan nilai ini.

Jangan membaca nilai ini sebagai luas tambang, hutan yang dibuka, atau longsor yang terukur. Interpretasi tersebut memerlukan bukti tambahan dan verifikasi lapangan.

### Water

Water diestimasi dengan Modified Normalized Difference Water Index, atau MNDWI. Aplikasi menggunakan band hijau Sentinel-2 B03 dan band short-wave infrared B11:

```text
MNDWI = (B03 - B11) / (B03 + B11)
```

Aplikasi menghitung pixel valid sebagai water ketika `MNDWI > 0.1`. MNDWI dapat membantu memisahkan air terbuka dari vegetasi dan beberapa permukaan terbangun atau terbuka, tetapi sensitif terhadap air dangkal atau keruh, tanah basah, pencampuran garis pantai, sun glint, dan bayangan.

Bayangan awan dapat menyerupai air dalam citra indeks. Perhitungan memask kelas scene yang digunakan untuk no-data, pixel jenuh, bayangan awan, pixel tidak terklasifikasi, awan, dan cirrus, tetapi hasilnya masih dapat mengandung ketidakpastian klasifikasi. Periksa citra sumber dan persentase cloud-free sebelum menganggap perubahan air sebagai nyata.

### Luas cakupan

Luas cakupan adalah luas pixel raster di dalam mask cakupan yang dipilih. Aplikasi meminta gambar 512 kali 512 yang mencakup bounding box cakupan, merasterisasi cakupan ke grid tersebut, lalu memperkirakan lebar dan tinggi pixel dari koordinat bounding box dan latitude. Aplikasi mengonversi jumlah pixel ke hektare:

```text
area in hectares = pixel count × pixel width × pixel height / 10,000
```

Karena batas cakupan dirasterisasi, hasilnya adalah estimasi. Poligon kecil, garis pantai sempit, dan batas kompleks dapat memiliki error batas yang lebih besar daripada area luas.

**Scope area** yang ditampilkan tidak selalu merupakan luas geodesik tepat dari poligon asli. Untuk AOI, nilai **Area** Inspector dihitung secara terpisah dari geometri poligon dan merupakan referensi yang lebih baik untuk luas geometris poligon yang digambar.

### Cloud-free coverage

Cloud-free adalah proporsi pixel di dalam cakupan yang berisi nilai valid dalam render NDVI dan MNDWI:

```text
cloud-free coverage = valid pixels / pixels inside the scope mask
```

Request render menggunakan jendela waktu Sentinel-2 L2A yang berakhir pada tanggal yang dipilih. Jendela tersebut mencakup tanggal terpilih dan sembilan hari sebelumnya, dengan filter cloud-cover maksimum provider sebesar 100 persen. Karena itu, metrik tidak selalu dihitung dari satu gambar sesaat. Metrik merupakan render satelit yang dirakit dari data tersedia dalam jendela request tersebut, dengan pixel berawan ditangani oleh mask SCL jika berlaku.

Cloud-free coverage adalah indikator kualitas, bukan interval kepercayaan statistik. Misalnya, `80% cloud-free` berarti 80% pixel cakupan lolos mask data untuk kedua indeks. Itu tidak berarti hasilnya 80% akurat.

### Mengapa persentase mungkin tidak berjumlah 100%

UI menghitung setiap persentase yang ditampilkan dengan seluruh luas cakupan sebagai denominator:

```text
category percentage = category area / scope area × 100
```

Luas kategori hanya menghitung pixel valid, sedangkan luas cakupan mencakup semua pixel di dalam cakupan, termasuk pixel yang ditolak mask data. Ketika cloud-free coverage di bawah 100 persen, persentase vegetation, bare / sparse, dan water dapat berjumlah kurang dari 100 persen. Bagian yang hilang bukan kelas tutupan lahan lain secara otomatis; biasanya bagian itu adalah citra yang termask atau tidak tersedia.

### Cara membaca hasil

Gunakan nilai ini sebagai deskripsi tahap pertama atas cakupan dan tanggal yang dipilih:

- Bandingkan vegetation, bare / sparse, dan water hanya ketika cakupan, tanggal, dan cloud-free coverage sebanding.
- Dahulukan persentase cloud-free yang lebih tinggi sebelum membuat perbandingan visual.
- Periksa citra sumber ketika hasil berubah tajam.
- Gunakan AOI untuk tempat tetap dan Viewport untuk tampilan cepat yang sedang ada di layar.
- Gunakan Island untuk konteks luas, bukan untuk kesimpulan tentang lokasi kecil.
- Perlakukan perbedaan kecil sebagai tidak pasti ketika dekat dengan resolusi raster atau ketika cloud-free coverage rendah.

Gunakan slider opacity layer hanya untuk membandingkan pola metrik pada peta dengan basemap satelit atau layer referensi. Slider tidak mengubah nilai ini atau membuat hasil dengan cakupan rendah menjadi lebih andal.

### Contoh: membaca hasil Land Cover

Berikut adalah hasil ilustratif, bukan observasi dari lokasi nyata:

```text
Scope: AOI
Vegetation: 62 ha (62%)
Bare / sparse: 18 ha (18%)
Water: 5 ha (5%)
Scope area: 100 ha
Cloud-free: 85%
```

Baca sebagai berikut: di dalam AOI yang digambar, komposit satelit terpilih mengklasifikasikan sekitar 62 hektare pixel valid sebagai vegetation, 18 hektare sebagai bare atau sparse, dan 5 hektare sebagai water. Area yang tersisa tidak otomatis menjadi kelas tutupan lahan keempat. Karena cloud-free coverage 85%, beberapa pixel termask atau tidak tersedia. Hasil ini menjelaskan jendela tanggal dan threshold yang dipilih. Hasil ini tidak membuktikan bahwa 18 hektare tersebut adalah tambang atau 62 hektare tersebut adalah hutan utuh.

Kalimat laporan yang sesuai adalah: **AOI berisi sekitar 62 ha yang diklasifikasikan sebagai vegetation dan 18 ha yang diklasifikasikan sebagai bare atau sparse dalam komposit satelit terpilih, dengan 85% cloud-free coverage.**

### Hal yang tidak dapat dibuktikan metrik ini

Land Cover tidak membuktikan:

- kualitas hutan, komposisi spesies, atau keanekaragaman hayati;
- penggunaan lahan legal atau ilegal;
- batas tepat tambang, pembukaan lahan, permukiman, atau badan air;
- jenis tanah, kimia air, konsentrasi sedimen, atau polusi;
- penyebab pola yang diamati;
- bahwa perubahan terjadi pada tanggal terpilih, bukan selama jendela render.

Gunakan metrik bersama layer peta, tanggal scene, bukti change detection, catatan resmi, dan verifikasi lapangan. Aplikasi memberi label sebagai estimasi satelit kasar karena hasilnya diturunkan dari pixel penginderaan jauh, threshold, masking, dan resolusi output tetap.

### Change detection

Change detection membandingkan dua render satelit pada AOI yang Anda gambar. Fitur ini menandai pixel yang memenuhi aturan yang telah ditentukan dan mengonversi jumlah pixel yang ditandai menjadi estimasi luas. Fitur ini tidak mengidentifikasi penyebab perubahan dan tidak membuktikan bahwa aktivitas tertentu terjadi.

Untuk menjalankannya:

1. Gambar AOI pada peta.
2. Pilih jenis perubahan di Inspector.
3. Pilih tanggal lebih awal pada **From** dan tanggal lebih akhir pada **To**.
4. Pilih **Run analysis**.
5. Baca luas perubahan bersama metode, tanggal, sumber, dan persentase cloud-free.

Aplikasi menukar tanggal jika dimasukkan dalam urutan terbalik, sehingga hasil tetap menggunakan tanggal lebih awal sebagai tanggal A dan tanggal lebih akhir sebagai tanggal B.

### Arti hasil

Overlay berwarna menunjukkan pixel yang memenuhi aturan perubahan yang dipilih. **Changed area** adalah total estimasi luas pixel tersebut. Ini bukan luas tambang, pembukaan lahan, banjir, plume sedimen, atau peristiwa dunia nyata lain yang terkonfirmasi.

Inspector memberi label persentase cloud-free sebagai **Confidence**. Baca ini sebagai cakupan data, bukan akurasi model. Nilai ini memberi tahu seberapa banyak AOI yang memiliki nilai valid dalam kedua render tanggal. Nilai tinggi tidak menjamin perubahan nyata, dan nilai rendah membuat hasil kurang lengkap serta lebih sulit ditafsirkan.

### Vegetation loss

Vegetation loss menggunakan render NDVI mentah untuk kedua tanggal. Pixel ditandai ketika NDVI-nya turun setidaknya `0.15`:

```text
NDVI at date B - NDVI at date A <= -0.15
```

Aturan ini mendeteksi penurunan indeks. Aturan ini tidak mengharuskan pixel menjadi lahan terbuka dan tidak mengharuskan pixel melewati threshold vegetation `0.2`. Karena itu, pixel hutan dapat memicu vegetation loss walaupun NDVI akhirnya masih di atas `0.2`.

Kemungkinan penyebab mencakup pembukaan lahan, panen, kerusakan akibat kebakaran, kekeringan, perubahan musim, banjir, bayangan, efek atmosfer, atau perbedaan antara observasi satelit yang tersedia. Tinjau citra true-color dan false-color, kualitas scene, tanggal pengambilan, dan cloud mask sebelum menganggap hasil sebagai kerusakan lingkungan.

### New bare land

New bare land menggunakan NDVI mentah dan mencari transisi tertentu:

```text
NDVI at date A >= 0.2 AND NDVI at date B < 0.2
```

Aturan ini menandai pixel yang berada di atas threshold vegetation aplikasi pada tanggal A dan di bawahnya pada tanggal B. Aturan ini tidak membuktikan bahwa pixel menjadi tanah terbuka. Nilai NDVI rendah pada tanggal berikutnya juga dapat berasal dari air, bayangan, perubahan vegetasi musiman, artefak terkait awan yang lolos mask, atau kondisi permukaan lain.

Gunakan metrik Land Cover **Bare / sparse** dan citra sumber untuk menambah konteks. Hasil new-bare-land merupakan indikasi bahwa pixel melewati threshold indeks ini, bukan survei lahan.

### Water change

Water change menggunakan MNDWI mentah dan threshold water yang sama dengan perhitungan Land Cover, `0.1`. Fitur ini menandai kedua arah pelintasan:

```text
water gain:  MNDWI at date A < 0.1 AND MNDWI at date B >= 0.1
water loss:  MNDWI at date A >= 0.1 AND MNDWI at date B < 0.1
```

Kedua arah menggunakan warna overlay yang berbeda. Hasil menunjukkan bahwa pixel berpindah melintasi threshold water. Hasil tidak mengukur kedalaman air, kualitas air, kedalaman banjir, posisi garis pantai, atau penyebab perubahan.

Air dangkal, air keruh, tanah basah, pencampuran garis pantai, sun glint, dan bayangan dapat memengaruhi MNDWI. Bandingkan hasil dengan citra true-color, Scene water edge, baseline coastline, informasi curah hujan atau pasang bila tersedia, dan bukti lapangan.

### Cara dua tanggal dirender

Untuk setiap tanggal yang diminta, aplikasi meminta gambar NDVI atau MNDWI mentah dari Copernicus Data Space Process API. Request mencakup tanggal terpilih dan sembilan hari sebelumnya, sehingga setiap tanggal mewakili jendela render sepuluh hari, bukan selalu satu observasi sesaat:

```text
from = selected date - 9 days
to   = selected date
```

Request menggunakan data Sentinel-2 L2A dan filter cloud-cover maksimum provider sebesar 100 persen. Render mentah mengodekan setiap nilai indeks ke dalam channel pixel agar browser dapat mendekodekannya kembali ke rentang `-1` hingga `1`. Channel alpha membawa mask data valid.

Karena setiap tanggal adalah sebuah jendela, perbandingan dapat mencerminkan perbedaan observasi yang tersedia di dalam jendela tersebut. Tanggal yang ditampilkan pada hasil adalah tanggal akhir yang diminta, bukan jaminan bahwa setiap pixel diamati tepat pada hari itu.

### Masking awan dan pixel tidak valid

Render mentah memeriksa Sentinel-2 Scene Classification Layer, atau SCL. Aplikasi mengecualikan kelas SCL berikut dari mask valid:

- no data;
- pixel jenuh atau rusak;
- bayangan awan;
- pixel tidak terklasifikasi;
- awan probabilitas sedang;
- awan probabilitas tinggi;
- cirrus.

Pixel hanya dapat digunakan untuk change detection ketika kedua render tanggal memiliki nilai alpha yang valid. Jika salah satu tanggal tidak valid, pixel dikeluarkan dari jumlah pixel berubah dan jumlah pixel valid.

Mask mengurangi kesalahan awan dan bayangan yang terlihat jelas, tetapi tidak menghapus setiap sumber ketidakpastian. Pixel valid masih dapat dipengaruhi haze, kondisi musiman, tutupan lahan campuran, ketinggian air, atau perbedaan pencahayaan.

### Perhitungan luas perubahan

Aplikasi menggunakan bounding box AOI sebagai grid perbandingan 512 kali 512. Aplikasi merasterisasi AOI ke grid tersebut dan hanya menghitung pixel di dalam poligon. Untuk setiap pixel di dalam yang valid pada kedua tanggal, aplikasi menerapkan aturan yang dipilih.

Luas perubahan yang ditampilkan dihitung sebagai:

```text
changed area in hectares = changed pixel count × pixel width × pixel height / 10,000
```

Lebar pixel menggunakan rentang longitude yang disesuaikan dengan cosinus latitude titik tengah AOI. Tinggi pixel menggunakan rentang latitude. Ini adalah estimasi berdasarkan bounding box dan grid raster, bukan perhitungan geodesik untuk setiap pixel.

AOI kecil, fitur sempit, batas kompleks, dan poligon panjang atau tidak beraturan dapat memiliki error rasterisasi yang lebih terlihat. Hasil sebaiknya dibaca sebagai luas perkiraan, terutama ketika hanya sedikit pixel yang berubah.

### Cloud-free coverage dalam change detection

Cakupan change detection dihitung sebagai:

```text
cloud-free coverage = pixels valid in both dates / pixels inside the AOI mask
```

Denominator adalah jumlah pixel raster di dalam AOI. Numerator memerlukan data valid pada kedua tanggal. Pixel yang cerah pada satu tanggal tetapi berawan pada tanggal lain tidak dihitung sebagai valid untuk perbandingan.

Analisis dapat menghasilkan hasil dengan cakupan rendah, tetapi evaluator alert menolak membuat alert ketika cakupan di bawah `30%`. Hal ini mencegah sistem alert memperlakukan hasil yang banyak termask sebagai bukti yang dapat ditindaklanjuti. Overlay perubahan tetap harus diperlakukan secara hati-hati ketika cakupan rendah.

### Cara menafsirkan hasil perubahan

- Mulai dengan metode. Vegetation loss, new bare land, dan water change menjawab pertanyaan yang berbeda.
- Periksa tanggal A dan tanggal B. Pastikan periode sesuai dengan pertanyaan yang diajukan.
- Periksa cloud-free coverage untuk kedua tanggal melalui nilai cakupan yang dilaporkan.
- Periksa citra sumber di sekitar pixel yang disorot.
- Bandingkan hasil dengan sungai, garis pantai, izin, permukiman, terrain, dan layer relevan lain di dekatnya.
- Ulangi analisis dengan pasangan tanggal yang dapat digunakan dan berdekatan ketika hasil penting.
- Perlakukan pola yang luas dan konsisten sebagai bukti penyaringan yang lebih kuat daripada satu kelompok pixel terisolasi.

Gunakan opacity untuk memeriksa perubahan yang disorot terhadap citra sumber dan layer konteks. Warna overlay yang lebih kuat hanya membuat pixel lebih mudah dilihat; hal itu tidak menambah luas perubahan, confidence, atau kekuatan bukti.

### Contoh: membaca hasil Change Detection

Berikut adalah hasil ilustratif, bukan observasi dari lokasi nyata:

```text
Method: Vegetation loss
From: 2024-06-01
To: 2024-09-01
Changed area: 8.4 ha
Confidence: 78%
Source: Sentinel-2 L2A
```

Baca **Changed area: 8.4 ha** sebagai estimasi luas pixel AOI yang NDVI mentahnya turun setidaknya `0.15`. Baca **Confidence: 78%** sebagai proporsi pixel AOI yang valid pada kedua render tanggal, bukan sebagai skor akurasi. Tanggal tersebut adalah akhir jendela render sepuluh hari, bukan bukti bahwa perubahan terjadi tepat pada salah satu tanggal.

Kalimat laporan yang sesuai adalah: **Analisis mendeteksi sekitar 8.4 ha pixel yang memenuhi aturan vegetation-loss di antara jendela perbandingan yang dipilih, dengan cakupan valid 78%. Hasil ini perlu ditinjau terhadap citra sumber dan bukti tambahan.**

### Hal yang tidak dapat dibuktikan change detection

Change detection tidak dapat membuktikan:

- bahwa pertambangan, penebangan, pembangunan, banjir, atau aktivitas tertentu lain menyebabkan perubahan;
- bahwa perubahan terjadi tepat pada tanggal B;
- bahwa setiap pixel yang disorot berubah di lapangan;
- status hukum suatu aktivitas atau apakah syarat izin dilanggar;
- kualitas, kimia, kedalaman, atau kontaminasi air;
- batas atau volume material yang dipindahkan secara tepat;
- bahwa area yang tidak disorot tidak berubah ketika area itu termask atau tidak tersedia.

Gunakan hasil untuk menentukan lokasi pemeriksaan berikutnya. Konfirmasikan temuan penting dengan citra tambahan, catatan resmi, pengetahuan lokal, dan verifikasi lapangan.

## Timeline

Timeline mencantumkan akuisisi Sentinel-2 yang beririsan dengan area pencarian Taliabu. Pilih scene untuk menjadikan tanggalnya aktif bagi layer peta dan metrik Land Cover. Timeline adalah browser scene, bukan grafik deret waktu dari variabel lingkungan yang diukur.

### Pintasan tanggal

Pintasan mengubah periode pencarian akuisisi:

- **Latest** mencari 30 hari sebelumnya.
- **1 Month** mencari satu bulan sebelumnya.
- **6 Months** mencari enam bulan sebelumnya.
- **1 Year** mencari satu tahun sebelumnya.

Pencarian menggunakan tanggal saat ini sebagai akhir periode. Daftar dapat berubah ketika scene baru tersedia atau provider memperbarui katalognya.

### Kualitas scene dan tanggal

Setiap chip timeline menampilkan tanggal akuisisi dan nilai cloud-cover provider jika tersedia. Titik berwarna dan gaya chip memberi petunjuk kualitas cepat:

- **Excellent**: cloud cover paling tinggi 10 persen.
- **Good**: cloud cover di atas 10 persen dan paling tinggi 30 persen.
- **Cloudy**: cloud cover di atas 30 persen.
- **Partial**: metadata cloud-cover tidak tersedia.

Label ini menjelaskan metadata akuisisi STAC, bukan persentase cloud-free tepat di dalam AOI yang dipilih. Nilai yang ditampilkan untuk akuisisi berkelompok adalah nilai cloud-cover terendah yang dilaporkan di antara tile yang dikelompokkan untuk akuisisi tersebut. Nilai itu tidak boleh dibaca sebagai rata-rata seluruh pulau atau jaminan bahwa setiap bagian Taliabu cerah.

Tanggal akuisisi adalah tanggal dan waktu yang dicatat katalog scene. Tanggal ini berbeda dari tanggal provider mengindeks scene dan berbeda dari tanggal aplikasi merender analisis. Pemrosesan provider dapat menunda munculnya akuisisi baru dalam daftar.

Cloud cover dan cloud-free coverage menjawab pertanyaan yang berbeda:

- **Cloud cover** adalah metadata provider yang digunakan saat mencari dan memberi label akuisisi.
- **Cloud-free coverage** dihitung untuk raster dan cakupan yang diminta setelah aplikasi menerapkan mask pixel.

Gunakan nilai cloud-free dari hasil analisis saat menilai apakah hasil Land Cover atau Change Detection tertentu memiliki cukup pixel yang dapat digunakan.

### Cara scene menjadi aktif

Ketika memilih scene timeline, aplikasi menggunakan tanggal akuisisinya untuk tanggal peta aktif dan meminta layer citra yang sesuai. Perhitungan Land Cover menggunakan jendela render sepuluh hari yang berakhir pada tanggal tersebut dan menerapkan filter cloud-cover maksimum provider sebesar 100 persen. Pixel berawan harus dibaca bersama mask SCL dan cloud-free coverage. Karena itu, tanggal aktif menunjukkan akhir jendela analisis; tanggal tersebut tidak menjamin setiap pixel yang ditampilkan berasal dari satu gambar yang diambil pada tanggal itu.

Jika tidak ada scene yang dipilih, panel Land Cover meminta Anda memilih scene sebelum menghitung metrik. Jika layanan render tidak dapat mengembalikan citra untuk tanggal terpilih, panel menunjukkan bahwa metrik tidak tersedia untuk scene tersebut.

### Membandingkan scene

Compare adalah tinjauan visual berdampingan atas dua akuisisi yang dipilih. Compare tidak menghitung luas perubahan dan tidak menerapkan threshold Land Cover atau Change Detection.

Pilih scene kedua dari Timeline, lalu pilih mode perbandingan jika tersedia:

- **Swipe** membandingkan dua scene dengan pembatas yang dapat digeser.
- **Split** menampilkan scene pada area peta yang terpisah.

Kedua peta perbandingan bergerak bersama agar Anda dapat memeriksa lokasi yang sama. Perbandingan menggunakan extent citra tetap di sekitar Taliabu, menampilkan overlay batas, dan merender setiap akuisisi terpilih sebagai citra true-color. Perbandingan tidak menyalin layer tematik yang sedang aktif dari peta utama.

Render perbandingan meminta tanggal kalender setiap akuisisi tanpa jendela tanggal tambahan. Provider masih dapat memilih observasi yang tersedia untuk tanggal tersebut. Kedua gambar dapat berbeda karena pencahayaan, pasang, haze, kondisi musiman, awan, atau jarak waktu antar-akuisisi.

Gunakan Swipe ketika ingin memeriksa satu lokasi sambil menampilkan satu tanggal secara bergantian. Gunakan Split ketika ingin kedua tanggal terlihat sekaligus. Setelah membandingkan, keluar dari mode compare untuk kembali ke peta utama dan layer aktifnya.

### Cara memilih tanggal

- Pilih tanggal yang cukup berjauhan agar sesuai dengan proses yang ingin diamati, tetapi tidak terlalu berjauhan sehingga musim mendominasi perbandingan.
- Utamakan tanggal dengan kualitas awan dan cakupan yang dapat digunakan serupa, bukan tanggal yang sekadar paling baru.
- Gunakan timestamp akuisisi dan metadata cloud sebagai informasi penyaringan, lalu periksa citra sebenarnya.
- Untuk hasil perubahan numerik, gunakan Change Detection dengan AOI. Mode Compare saja adalah bukti visual.
- Jangan membandingkan tanggal berawan dengan tanggal cerah lalu menyebut perbedaan visualnya sebagai perubahan lingkungan.

## Alerts

Alert adalah flag berbasis aturan yang dibuat dari hasil Change Detection dan konteks spasial AOI. Alert membantu memprioritaskan peninjauan. Alert bukan temuan otomatis tentang aktivitas ilegal, kerusakan lingkungan, atau pelanggaran hukum.

Alert hanya dapat dibuat setelah Anda:

1. Menggambar AOI.
2. Menjalankan salah satu analisis Change Detection yang didukung.
3. Memiliki cakupan valid yang cukup bagi evaluator alert.
4. Memenuhi threshold alert atau aturan spasial yang dipilih.

Panel alert menampilkan aturan, metode, luas perubahan, jendela tanggal, cloud-free coverage, threshold, konteks, dan sumber. Baca field ini sebelum menyimpan alert.

### Alert log

Alert log menyimpan peristiwa monitoring yang disimpan dalam database D1 aplikasi. Gunakan filter kind untuk mempersempit daftar, lalu pilih baris untuk membuka buktinya. Memilih alert dapat memfokuskan AOI-nya pada peta. Tutup alert untuk menghapus fokus dan mengembalikan tampilan peta sebelumnya.

Daftar menampilkan jenis alert, titik severity, luas perubahan, dan tanggal yang lebih akhir. Bukti yang dibuka menambahkan metode tepat, cloud-free coverage, jendela analisis, threshold, konteks spasial, sumber, dan tanggal pembuatan.

Aplikasi saat ini memuat hingga 50 entri terbaru pada panel. Endpoint server mendukung limit lebih besar, tetapi antarmuka tidak menampilkan browser arsip atau tindakan hapus. Log kosong berarti tidak ada entri tersimpan yang dikembalikan untuk filter yang dipilih; itu tidak membuktikan bahwa tidak pernah ada perubahan yang terdeteksi.

### Gerbang cakupan alert

Evaluator alert menolak membuat alert apa pun ketika cakupan Change Detection di bawah `30%`:

```text
if cloud-free coverage < 30%: create no alert
```

Ini adalah perlindungan penyaringan. Hal ini tidak berarti hasil pada 30% akurat atau hasil pada 29% mustahil. Artinya aplikasi tidak mempromosikan perbandingan yang banyak termask menjadi alert. Hasil Change Detection dasarnya tetap dapat diperiksa, tetapi perlu kehati-hatian lebih besar.

### Alert vegetation loss

Alert ini hanya dievaluasi ketika jenis Change Detection yang dipilih adalah **Vegetation loss**. Threshold default adalah `5 ha`:

```text
changed vegetation-loss area >= vegetation-loss threshold
```

Anda dapat mengubah threshold pada panel alert sebelum menyimpan. Threshold mengubah keputusan alert, bukan hasil Change Detection yang mendasarinya atau pixel yang ditandai.

Jenis alert adalah **Vegetation loss**. Alert menggunakan aturan penurunan NDVI yang sama seperti yang dijelaskan dalam Change Detection. Alert tidak berarti seluruh area yang berubah telah dibuka atau kehilangan vegetasi disebabkan oleh pertambangan.

### Alert konteks new bare land

Alert ini hanya dievaluasi ketika jenis Change Detection yang dipilih adalah **New bare land**. Sistem menggabungkan hasil threshold indeks dengan konteks AOI yang dihitung dari data referensi statis.

Threshold jarak default adalah `500 m`. Jarak dihitung dari centroid AOI ke sungai terdekat yang diketahui atau garis pantai baseline, bukan dari setiap pixel yang berubah:

- **Change near river**: hasil new-bare-land dan centroid AOI berada dalam jarak 500 m dari sungai terdekat yang diketahui.
- **Change near coast**: hasil new-bare-land dan centroid AOI berada dalam jarak 500 m dari garis pantai baseline.
- **Change outside IUP**: hasil new-bare-land dan AOI tidak beririsan dengan poligon IUP yang diketahui.

Threshold jarak dapat diubah pada panel alert. Aturan IUP tidak memiliki threshold numerik; aturan itu bergantung pada apakah AOI yang dipilih beririsan dengan poligon izin yang diketahui.

Aturan ini menjelaskan konteks spasial, bukan sebab-akibat. Perubahan dekat sungai belum tentu terkait sungai. Perubahan di luar IUP yang diketahui bukan bukti penambangan ilegal karena dataset izin dapat tidak lengkap, kedaluwarsa, atau tidak terkait dengan aktivitas yang sedang diselidiki.

### Water change dan alert

Water Change tersedia sebagai metode Change Detection, tetapi evaluator alert saat ini tidak membuat alert untuknya. Water Change tetap dapat menghasilkan hasil visual dan estimasi luas perubahan. Simpan sebagai bukti pendukung melalui export atau catat secara terpisah jika observasi itu penting.

### Severity

Severity alert ditetapkan dari luas perubahan:

- **Medium**: luas perubahan di bawah `25 ha`.
- **High**: luas perubahan `25 ha` atau lebih.

Severity adalah kategori tampilan berbasis ukuran. Severity bukan probabilitas, skor confidence, ukuran bahaya, atau prioritas hukum. Perubahan kecil tetap dapat penting, dan area besar yang terdeteksi dapat disebabkan kondisi citra, bukan peristiwa nyata.

### Field bukti alert

Setiap alert yang dibuat mencakup:

- **Rule**: kondisi yang menyebabkan alert.
- **Method**: threshold Change Detection yang digunakan.
- **Metric**: `ndvi-raw` untuk analisis terkait vegetasi atau `mndwi-raw` untuk analisis air.
- **Changed area**: estimasi luas pixel yang memenuhi aturan.
- **Cloud-free**: pixel valid pada kedua tanggal dibagi pixel di dalam AOI.
- **Window**: tanggal analisis lebih awal dan lebih akhir.
- **Threshold**: nilai area atau jarak yang dikonfigurasi pengguna saat analisis.
- **Context**: sungai terdekat, jarak garis pantai, dan izin yang diketahui jika relevan.
- **Source**: Sentinel-2 L2A.
- **Generated**: tanggal aplikasi membuat objek bukti, bukan tanggal akuisisi.

Simpan bukti bersama laporan atau export. Tanggal pembuatan memberi tahu kapan aplikasi mengevaluasi hasil; tanggal tersebut tidak memberi tahu kapan perubahan lingkungan terjadi.

### Penyimpanan dan deduplikasi

Pilih **Save to alert log** untuk menyimpan alert yang sedang ditampilkan. Server menulis jenis alert, severity, AOI, scene ID opsional, bukti, dan fingerprint deduplikasi ke D1.

Menyimpan analisis yang sama lagi tidak membuat baris lain. Fingerprint menggabungkan:

- jenis alert;
- tanggal A dan tanggal B;
- luas perubahan yang dibulatkan menjadi satu desimal hektare;
- bounding box analisis yang dibulatkan menjadi empat angka desimal;
- koordinat AOI yang dibulatkan menjadi lima angka desimal.

Timestamp pembuatan tidak disertakan, sehingga menjalankan ulang analisis yang sama diperlakukan sebagai duplikat. Perubahan kecil pada AOI, tanggal, luas hasil, atau bounding box dapat menghasilkan fingerprint baru dan karena itu entri baru.

Deduplikasi mencegah penyimpanan berulang memperbesar log. Deduplikasi tidak menentukan apakah dua alert menggambarkan peristiwa dunia nyata yang sama pada jendela tanggal berbeda.

### Cara menafsirkan alert

- Perlakukan alert sebagai ajakan untuk memeriksa bukti, bukan kesimpulan.
- Buka bukti dan periksa aturan, tanggal, metode, dan cloud-free coverage.
- Tinjau perubahan yang disorot pada peta dan periksa citra sumber.
- Periksa apakah konteks spasial berasal dari dataset sungai, garis pantai, atau IUP yang diketahui dan sesuai dengan pertanyaan.
- Bandingkan dengan pasangan tanggal lain yang dapat digunakan sebelum menaikkan temuan.
- Konfirmasikan temuan penting dengan catatan resmi, pengetahuan lokal, dan verifikasi lapangan.

Jika alert difokuskan pada peta, sesuaikan opacity layer di dekatnya untuk memeriksa AOI terhadap izin, sungai, garis pantai, permukiman, atau citra sumber. Slider tidak mengubah aturan atau bukti alert yang tersimpan.

### Contoh: membaca entri Alert Log

Berikut adalah entri alert ilustratif, bukan peristiwa tersimpan dari aplikasi:

```text
Kind: Vegetation loss
Severity: Medium
Changed area: 8.4 ha
Window: 2024-06-01 to 2024-09-01
Cloud-free: 78%
Threshold: 5 ha
Source: Sentinel-2 L2A
```

Baca entri ini sebagai berikut: hasil vegetation-loss melewati threshold luas `5 ha` yang dikonfigurasi, sehingga aplikasi menyimpannya sebagai alert **Medium** karena luas perubahan di bawah `25 ha`. Alert mencatat kondisi penyaringan dan bukti pendukungnya. Alert tidak mengatakan bahwa 8.4 hektare pasti dibuka, pertambangan menyebabkan perubahan, atau pelanggaran hukum terjadi.

Kalimat laporan yang sesuai adalah: **Alert log berisi alert vegetation-loss Medium untuk sekitar 8.4 ha di antara jendela perbandingan yang dipilih. Hasil melewati threshold alert 5 ha dan memiliki cakupan valid 78%. Hasil harus diperiksa terhadap peta, citra sumber, catatan, dan bukti lapangan.**

## Export dan bukti

Inspector menyediakan export CSV, GeoJSON, JSON, dan PNG. Baca setiap export bersama sumber, metode, periode, AOI, dan disclaimer proksi. Export mencatat status aplikasi saat ini; export tidak membuat pengukuran baru atau meningkatkan akurasi data dasar.

### CSV

CSV adalah tabel datar metrik yang tersedia pada status Inspector saat ini. CSV dapat mencakup:

- luas AOI, irisan izin, sungai terdekat, permukiman terdekat, jarak pantai, daerah aliran sungai, elevasi, kemiringan, dan jarak hilir;
- luas perubahan dan cloud-free coverage Change Detection;
- vegetation, bare / sparse, water, scope area, cloud-free coverage, dan resolusi raster Land Cover.

Setiap baris memiliki kolom `metric`, `value`, `unit`, dan `note` opsional. File hanya berisi nilai yang tersedia ketika Anda mengeklik export. Misalnya, file dapat berisi metrik perubahan tetapi tidak memiliki konteks AOI jika analisis AOI tidak tersedia.

Gunakan kolom unit ketika mengimpor file ke spreadsheet. Hektare disingkat sebagai `ha`, persentase sebagai `%`, jarak sebagai `m` atau `km`, kemiringan sebagai `deg`, dan resolusi raster sebagai `m/px`. Nilai CSV tidak bermakna tanpa tanggal analisis, cakupan, sumber, dan metode, jadi simpan JSON terkait atau catatan tertulis bersamanya.

### GeoJSON

GeoJSON mengekspor poligon AOI saat ini sebagai satu fitur. Properties-nya mencakup tanggal observasi, periode perbandingan opsional, sumber citra, waktu pembuatan, atribusi peta, dan disclaimer proksi. Jika tersedia, GeoJSON juga mencakup luas AOI, izin, irisan izin, sungai terdekat, jarak pantai, daerah aliran sungai, dan konteks Change Detection.

GeoJSON berguna ketika aplikasi GIS lain memerlukan geometri AOI dan konteks analisisnya. Geometri tersebut adalah poligon yang digambar, bukan outline raster dari pixel yang berubah. Properties perubahan menjelaskan hasil saat ini, tetapi GeoJSON tidak berisi gambar overlay perubahan lengkap.

### JSON

JSON adalah export snapshot paling lengkap. JSON dapat berisi:

- konteks export dan atribusi;
- koordinat AOI dan luas geometris;
- jenis Change Detection, metode, luas perubahan, coverage, dan bounding box;
- alert yang dibuat saat ini;
- hasil Land Cover saat ini.

JSON sesuai untuk mempertahankan snapshot monitoring yang dapat dibaca mesin. JSON tetap merepresentasikan status saat export. Jika citra sumber, data referensi statis, atau kode perhitungan berubah kemudian, menjalankan ulang analisis yang sama dapat menghasilkan hasil berbeda.

### PNG

PNG menangkap canvas peta yang terlihat setelah repaint peta berikutnya dan menambahkan bar atribusi di bawahnya. Tangkapan layar mencakup visibilitas dan opacity layer aktif saat pengambilan. Footer mengidentifikasi Taliabu Environmental Monitor, Sentinel-2 L2A jika berlaku, tanggal observasi, dan atribusi OpenFreeMap atau OpenStreetMap.

Sebelum mengekspor PNG, atur slider agar pola dan konteksnya sama-sama terbaca. Slider hanya memengaruhi tangkapan layar ini. Nilai metrik CSV, GeoJSON, dan JSON tidak berubah ketika opacity berubah.

PNG adalah catatan visual. PNG tidak berisi nilai pixel dasar, geometri AOI, pengaturan threshold, perhitungan cloud-free, atau metadata sumber lengkap. Gunakan CSV, GeoJSON, atau JSON ketika orang lain perlu memeriksa atau mereproduksi analisis.

### Share link

**Copy share link** menyimpan kamera dan AOI saat ini dalam parameter URL. Kamera menyimpan longitude, latitude, dan zoom. Koordinat AOI dibulatkan menjadi lima angka desimal sebelum dikodekan.

Share link tidak menyimpan scene yang dipilih, visibilitas layer aktif, basemap, mode perbandingan, threshold, atau alert yang dibuat. Karena itu, penerima dapat melihat scene atau status layer yang berbeda ketika membuka link nanti. Perlakukan link sebagai cara membagikan lokasi dan konteks AOI, bukan paket bukti permanen.

### Checklist bukti

Saat membagikan export, sertakan:

- file export;
- tanggal akuisisi atau jendela perbandingan;
- cakupan atau AOI yang dipilih;
- metode Change Detection atau cakupan Land Cover;
- cloud cover dan cloud-free coverage;
- sumber data dan tanggal pengambilan jika tersedia;
- layer referensi, izin, sungai, atau konteks garis pantai yang relevan;
- tanggal saat export dibuat.

## Sumber data dan refresh

Aplikasi menggabungkan citra satelit live atau yang dirender provider dengan dataset referensi yang disiapkan. Sumber-sumber ini memiliki jadwal pembaruan dan arti yang berbeda. Kehadiran sebuah layer pada peta tidak berarti layer itu diambil pada waktu yang sama dengan scene satelit.

### Metadata akuisisi satelit

Aplikasi mencari API [STAC Copernicus Data Space](https://stac.dataspace.copernicus.eu/) untuk metadata akuisisi `sentinel-2-l2a` di atas bounding box pencarian Taliabu. Hasilnya mencakup waktu akuisisi, metadata cloud-cover, identifier scene, jumlah tile, dan informasi provider. Pencarian scene yang berhasil ditulis ke tabel D1 `satellite_scenes`. Jika pencarian provider gagal, worker dapat mengembalikan akuisisi yang cocok dari cache.

Katalog akuisisi adalah metadata. Katalog memberi tahu aplikasi observasi yang tersedia untuk dicari; katalog bukan hasil Land Cover atau Change Detection itu sendiri.

### Pemrosesan citra satelit

Aplikasi meminta citra Sentinel-2 L2A dari [Copernicus Data Space](https://dataspace.copernicus.eu/) Process API. Aplikasi mengirim bounding box, rentang waktu, batas cloud-cover, ukuran output, dan evalscript untuk layer yang diminta. Evalscript memilih band Sentinel-2 dan indeks atau komposit:

- true color: B04, B03, B02;
- NDVI: B08 dan B04;
- NDWI: B03 dan B08;
- MNDWI: B03 dan B11;
- false color: B08, B04, B03;
- SWIR composite: B12, B11, B04;
- SCL: Sentinel-2 Scene Classification Layer;
- SAR: Sentinel-1 VV dan VH untuk layer radar.

Aplikasi menerapkan mask scene-class pada layer yang mendukung masking. Render NDVI dan MNDWI mentah menggunakan mask tersebut untuk Land Cover dan Change Detection. Output-nya adalah raster PNG yang dirender, bukan arsip satelit asli yang diunduh.

### Layer referensi

Layer referensi adalah file GeoJSON atau raster yang disiapkan dan disajikan dari aplikasi. Layer tersebut menyediakan konteks spasial dan tidak di-refresh setiap kali pengguna membuka peta.

- **Batas Taliabu dan administratif**: layanan batas [BIG](https://geoservices.big.go.id/gis/rest/services/DISIGT/BatasWilayah/FeatureServer/0).
- **Batas izin**: catatan izin pertambangan [BIG Kebijakan Satu Peta](https://kspservices.big.go.id/satupeta/rest/services/PUBLIK/PERIZINAN_DAN_PERTANAHAN/MapServer/4), direpresentasikan sebagai poligon IUP yang diketahui.
- **Sungai**: jaringan sungai [BIG Rupabumi Indonesia](https://geoservices.big.go.id/rbi/rest/services/BASEMAP/Rupabumi_Indonesia/MapServer/673).
- **Daerah aliran sungai**: batas daerah aliran sungai [BIG Atlas Wilayah Sungai](https://geoservices.big.go.id/gis/rest/services/PTRA/Atlas_Wilayah_Sungai/MapServer/5).
- **Garis pantai**: garis pantai baseline BIG yang digunakan untuk konteks jarak ke pantai.
- **Titik dan area permukiman**: layer referensi yang disiapkan dari layanan [titik BIG Rupabumi Indonesia](https://geoservices.big.go.id/rbi/rest/services/BASEMAP/Rupabumi_Indonesia/MapServer/97) dan [area](https://geoservices.big.go.id/rbi/rest/services/BASEMAP/Rupabumi_Indonesia/MapServer/808). Cakupan dapat jarang, jadi fitur permukiman yang hilang tidak membuktikan bahwa permukiman tidak ada.
- **Elevasi**: [data DEMNAS dari BIG](https://geoservices.big.go.id/raster/rest/services/DEMNAS/DEM_Indonesia/ImageServer/exportImage), diproses terlebih dahulu menjadi raster statis dengan datum vertikal EGM2008.
- **Kemiringan**: diturunkan dari raster elevasi DEMNAS menggunakan operator terrain Horn 3×3.
- **Drainase dan daerah tangkapan turunan**: dibuat dari DEMNAS menggunakan model aliran D8. Hasilnya adalah output model untuk orientasi, bukan hidrologi yang disurvei atau batas daerah aliran sungai resmi.
- **Outlet sungai**: muara sungai turunan D8 dengan luas daerah tangkapan yang dimodelkan. Saat dipilih, Inspector menghitung IUP terdekat yang diketahui dan jaraknya ke boundary dari snapshot IUP saat ini.
- **Basemap**: tile [OpenFreeMap](https://openfreemap.org/) dengan atribusi kontributor [OpenStreetMap](https://www.openstreetmap.org/).

Inspector layer dapat menampilkan source, version, retrieval date, dan refresh policy untuk fitur referensi yang didukung. File metadata mencatat sumber dan catatan yang digunakan aplikasi. Indeks raster seperti NDVI, MNDWI, NDTI, dan SCL adalah produk turunan scene dan harus dibaca bersama tanggal scene aktif serta citra sumber.

### Perilaku refresh dan cache

Pencarian akuisisi satelit menggunakan write-through cache: hasil yang berhasil disimpan ke D1, dan hasil cache yang cocok dapat dikembalikan ketika provider tidak tersedia. Endpoint citra yang dirender mengirim arahan cache browser satu jam untuk render analisis dan cache immutable yang lebih panjang untuk tile peta. Karena itu, respons cache dapat bertahan lebih lama daripada pembaruan katalog provider.

Layer referensi yang disiapkan mengikuti refresh policy yang dikonfigurasi. Sebagian adalah snapshot manual, izin pertambangan ditandai untuk refresh bulanan, dan layer satelit turunan scene di-refresh per scene. Pembaruan snapshot IUP mengubah konteks outlet saat runtime, tetapi tidak memerlukan pembangunan ulang geometri outlet. Periksa retrieval date dan version ketika layer referensi penting bagi keputusan.

Tanggal ketersediaan scene tidak sama dengan saat scene itu diambil. Pemrosesan provider dapat membuat jeda sebelum scene baru muncul dalam pencarian.

## Batasan interpretasi

Aplikasi ini adalah alat monitoring dan penyaringan. Aplikasi membantu orang menemukan lokasi dan tanggal yang perlu diperhatikan lebih dekat. Aplikasi tidak menggantikan pengukuran lapangan, peta resmi, dokumen izin, uji laboratorium, laporan komunitas, atau tinjauan hukum.

### Batasan observasi satelit

Sensor satelit mengukur energi yang dipantulkan atau dikembalikan, bukan hal yang ingin diketahui seseorang secara langsung. Aplikasi mengubah pengukuran tersebut menjadi indeks, mask, layer visual, atau hasil berbasis threshold. Awan, haze, bayangan, sudut matahari, tanah basah, ketinggian air, musim vegetasi, pixel campuran, dan pemrosesan provider dapat memengaruhi hasil.

Satu pixel dapat berisi beberapa permukaan. Sebuah pixel dapat mencakup vegetasi, tanah terbuka, jalan, atap, dan bayangan sekaligus. Nilai indeks yang dihasilkan mewakili sinyal gabungan, bukan satu objek yang teridentifikasi secara sempurna.

### Batasan resolusi dan luas

Perhitungan Land Cover dan Change Detection menggunakan grid output tetap 512 kali 512 pada bounding box cakupan yang diminta. Resolusi yang ditampilkan adalah ukuran pixel perkiraan. Fitur yang lebih kecil dari satu pixel, atau fitur yang melintasi beberapa pixel campuran, mungkin tidak terdeteksi dengan andal.

Luas yang dihitung adalah estimasi dari jumlah pixel dan dimensi pixel perkiraan. Luas ini bukan survei kadaster, pengukuran teknik, atau batas hukum. AOI kecil dan fitur sempit sangat sensitif terhadap rasterisasi dan error batas.

### Batasan klasifikasi

NDVI, MNDWI, NDWI, SCL, dan kelompok Land Cover bukan peta tutupan lahan lengkap. Semuanya adalah indeks atau klasifikasi diagnostik yang dirancang untuk tujuan penyaringan tertentu. Nilai atau warna tidak boleh diperlakukan sebagai label langsung seperti forest, mine, pollution, settlement, atau flood kecuali aplikasi secara eksplisit mendefinisikan hasil tersebut dan bukti mendukungnya.

Kelompok **Bare / sparse** sengaja luas. Kelompok ini dapat mencakup permukaan alami dan terbangun. Hasil **Vegetation loss** mengidentifikasi penurunan NDVI, bukan penyebabnya. Hasil **Water change** mengidentifikasi pelintasan threshold, bukan kedalaman atau kualitas air.

### Batasan tanggal dan sebab-akibat

Tanggal akuisisi tidak selalu merupakan tanggal peristiwa. Render Land Cover dan Change Detection menggunakan jendela waktu, sedangkan Compare menggunakan citra provider yang diminta untuk suatu tanggal kalender. Perbedaan yang terdeteksi mungkin terjadi kapan saja di antara observasi atau mungkin mencerminkan kondisi observasi yang berbeda.

Aplikasi tidak menyimpulkan sebab-akibat. Dari hasil satelit saja, aplikasi tidak dapat menentukan apakah perubahan berasal dari pertambangan, pertanian, penebangan, pembangunan, kebakaran, kekeringan, banjir, pasang, erosi, atau proses lain.

### Batasan data referensi

Layer izin, sungai, garis pantai, daerah aliran sungai, permukiman, elevasi, dan administratif adalah dataset terpisah dengan tanggal, skala, dan kebijakan pembaruan terpisah. Overlay peta dapat menjadi konteks berguna tanpa menjadi batas terkini yang tepat. Fitur yang hilang pada layer referensi tidak membuktikan fitur dunia nyata tersebut tidak ada.

AOI di luar layer IUP yang diketahui berarti AOI tidak beririsan dengan poligon izin yang tersedia bagi aplikasi ini. Hal itu tidak membuktikan bahwa izin tidak ada atau aktivitas tersebut ilegal. Perubahan dekat sungai atau pantai tidak membuktikan sungai atau pantai menyebabkan perubahan.

### Batasan alert

Alert adalah output aturan yang diterapkan pada hasil analisis dan konteks referensi. Severity adalah kategori berbasis ukuran, bukan skor risiko. Cloud-free coverage adalah ketersediaan data, bukan confidence statistik. Alert yang disimpan adalah catatan bahwa aturan terpenuhi, bukan insiden yang terverifikasi.

### Interpretasi yang bertanggung jawab

Gunakan urutan ini saat meninjau hasil:

1. Baca metode dan threshold.
2. Periksa tanggal akuisisi dan jendela render.
3. Periksa cloud-free coverage dan citra sumber.
4. Bandingkan hasil dengan konteks peta yang relevan.
5. Ulangi dengan tanggal atau metode lain yang sesuai bila memungkinkan.
6. Konfirmasikan temuan penting dengan catatan resmi dan verifikasi lapangan.

Saat melaporkan hasil, gunakan bahasa yang sesuai dengan bukti. Katakan **analisis mendeteksi penurunan NDVI di AOI ini selama jendela perbandingan**, bukan **aplikasi membuktikan pembukaan lahan ilegal**.

### Pertanyaan yang tidak dapat dijawab aplikasi sendiri

Aplikasi tidak dapat menjawab pertanyaan berikut tanpa bukti tambahan:

- Apakah suatu aktivitas legal?
- Siapa yang menyebabkan perubahan yang diamati?
- Material apa yang masuk ke sungai atau perairan pesisir?
- Apakah air aman bagi manusia, hewan, atau ekosistem?
- Berapa banyak material yang dipindahkan atau diendapkan?
- Spesies atau habitat apa yang terdampak?
- Apakah perubahan terjadi pada hari tertentu?
- Apakah izin masih berlaku, valid, atau sesuai dengan syaratnya?

Gunakan aplikasi untuk mendukung pertanyaan yang lebih baik dan pemilihan lokasi yang lebih baik bagi pekerjaan lanjutan.

## Glossary

### Acquisition

Observasi satelit yang dicatat provider dengan tanggal dan waktu. Metadata akuisisi membantu aplikasi membuat daftar dan membandingkan scene yang tersedia.

### AOI

**Area of Interest**. Poligon yang digambar pengguna. Land Cover dan Change Detection menggunakan AOI sebagai cakupan analisis. Batas AOI saat ini adalah 10.000 hektare, atau 100 kilometer persegi.

### B03, B04, B08, B11, B12

Band spektral Sentinel-2. B03 adalah green, B04 red, B08 near-infrared, dan B11 serta B12 adalah band short-wave infrared. Aplikasi menggabungkan band ini untuk menghitung indeks dan membuat komposit visual.

### Basemap

Peta latar yang digunakan untuk orientasi geografis. Vector, Satellite, dan Minimal adalah pilihan basemap. Basemap tidak otomatis menjadi layer analisis.

### Bbox

**Bounding box**. Persegi panjang yang ditentukan oleh koordinat west, south, east, dan north. Aplikasi menggunakan bounding box untuk meminta citra dan membuat grid raster. Bounding box dapat mencakup area di luar AOI tidak beraturan, yang kemudian dihapus oleh mask AOI.

### Cloud cover

Nilai metadata scene yang dilaporkan provider dan digunakan untuk mencari serta memberi label akuisisi. Nilai ini tidak sama dengan persentase cloud-free yang dihitung di dalam cakupan terpilih.

### Cloud-free coverage

Proporsi pixel di dalam cakupan analisis yang memiliki nilai valid dalam render citra yang diperlukan. Nilai ini mengukur cakupan data yang dapat digunakan, bukan akurasi atau confidence.

### DEMNAS

Model elevasi digital nasional Indonesia yang didistribusikan melalui layanan BIG. Aplikasi ini menggunakan layer konteks elevasi, kemiringan, drainase, daerah tangkapan, dan outlet sungai yang diturunkan dari DEMNAS.

### D8 flow model

Metode terrain yang menetapkan arah aliran setiap cell elevasi ke salah satu dari delapan cell tetangganya. Aplikasi menggunakannya untuk menurunkan konteks drainase dan daerah tangkapan. Hasilnya adalah model, bukan jaringan sungai hasil survei.

### GeoJSON

Format data geografis berbasis JSON. Aplikasi menggunakannya untuk layer vector dan export AOI. Format ini dapat menyimpan titik, garis, poligon, dan properties-nya.

### IUP

**Izin Usaha Pertambangan**, atau izin usaha pertambangan. Dalam aplikasi ini, IUP merujuk pada poligon izin yang diketahui dari dataset referensi yang dikonfigurasi. IUP bukan registri hukum lengkap dengan sendirinya.

### Index

Nilai yang dihitung dari band spektral untuk menonjolkan properti seperti vegetasi atau air. NDVI dan MNDWI adalah indeks. Indeks adalah proksi, bukan pengukuran lapangan langsung.

### Land Cover

Panel yang mengelompokkan pixel valid menjadi Vegetation, Bare / sparse, dan Water menggunakan threshold NDVI dan MNDWI. Hasilnya adalah estimasi satelit luas, bukan klasifikasi tutupan lahan lengkap.

### L2A

Data Sentinel-2 Level-2A. Data ini merupakan data surface-reflectance yang dikoreksi atmosfer dengan informasi klasifikasi scene. Aplikasi meminta koleksi ini untuk citra optik.

### MNDWI

**Modified Normalized Difference Water Index**. Dalam aplikasi ini, MNDWI dihitung dari B03 dan B11 serta digunakan untuk mengidentifikasi pixel terkait air dan perubahan threshold air.

### NDVI

**Normalized Difference Vegetation Index**. Dalam aplikasi ini, NDVI dihitung dari B08 dan B04 serta digunakan untuk menjelaskan vegetasi hijau dan perubahan terkait vegetasi.

### NDWI

**Normalized Difference Water Index**. Dalam aplikasi ini, NDWI adalah indeks visual terkait air yang menggunakan B03 dan B08. Land Cover dan Change Detection menggunakan MNDWI sebagai gantinya.

### NDTI

**Normalized Difference Turbidity Index**. Layer visual ini menggunakan band merah dan hijau sebagai proksi kekeruhan air relatif. Layer ini tidak mengidentifikasi polutan atau mengukur kimia air.

### Pixel

Satu cell dalam gambar raster. Pixel merepresentasikan area di permukaan tanah, bukan satu objek. Area tanah yang direpresentasikan pixel bergantung pada extent output dan dimensi gambar yang diminta.

### Proxy

Indikator tidak langsung yang digunakan ketika aplikasi tidak dapat mengukur target secara langsung. NDVI dapat berfungsi sebagai proksi vegetasi; NDTI dapat berfungsi sebagai proksi kekeruhan. Proksi memerlukan konteks dan validasi sebelum mendukung kesimpulan kuat.

### Raster

Gambar yang tersusun dari pixel, seperti layer indeks, citra satelit, raster elevasi, atau raster kemiringan.

### Resolution

Ukuran tanah perkiraan yang direpresentasikan oleh satu pixel output. Panel Land Cover dan Change Detection menampilkan nilai perkiraan meter-per-pixel untuk grid raster yang diminta.

### SCL

**Scene Classification Layer** dari pemrosesan Sentinel-2. Layer ini memberi label pixel seperti vegetasi, air, bayangan awan, awan, cirrus, dan no data. Aplikasi menggunakan kelas SCL tertentu untuk memask pixel tidak valid.

### STAC

**SpatioTemporal Asset Catalog**. Cara standar untuk mencari aset geospasial berdasarkan lokasi, tanggal, koleksi, dan metadata seperti cloud cover. Aplikasi menggunakan API STAC untuk metadata akuisisi.

### Scope

Area geografis yang diringkas oleh Land Cover. Scope dapat berupa pulau Taliabu, viewport saat ini, AOI yang digambar, atau izin yang dipilih.

### Threshold

Batas aturan yang digunakan untuk mengklasifikasikan atau menandai hasil. Contohnya NDVI lebih besar dari `0.2`, MNDWI lebih besar dari `0.1`, atau vegetation loss sekurang-kurangnya `5 ha` untuk sebuah alert.

### Vector

Fitur geografis yang direpresentasikan oleh koordinat dan geometri, seperti garis sungai, poligon izin, titik permukiman, atau AOI.
