let globalPredictions = [];
const startTime = performance.now();

// LOKASI
const translationDictionary = {
    "North Sumatra": "Sumatera Utara",
    "West Sumatra": "Sumatera Barat",
    "Riau Islands": "Kepulauan Riau",
    "South Sumatra": "Sumatera Selatan",
    "Bangka-Belitung Islands": "Kepulauan Bangka Belitung",
    "West Java": "Jawa Barat",
    "Special Capital Region of Jakarta": "DKI Jakarta",
    "Central Java": "Jawa Tengah",
    "Special Region of Yogyakarta": "DI Yogyakarta",
    "East Java": "Jawa Timur",
    "West Nusa Tenggara": "Nusa Tenggara Barat",
    "East Nusa Tenggara": "Nusa Tenggara Timur",
    "West Kalimantan": "Kalimantan Barat",
    "South Kalimantan": "Kalimantan Selatan",
    "Central Kalimantan": "Kalimantan Tengah",
    "East Kalimantan": "Kalimantan Timur",
    "North Kalimantan": "Kalimantan Utara",
    "South Sulawesi": "Sulawesi Selatan",
    "Southeast Sulawesi": "Sulawesi Tenggara",
    "Central Sulawesi": "Sulawesi Tengah",
    "North Sulawesi": "Sulawesi Utara",
    "West Sulawesi": "Sulawesi Barat",
    "North Maluku": "Maluku Utara",
    "West Papua": "Papua Barat",
};

var stateProvince = "";
document.addEventListener("DOMContentLoaded", () => {
    navigator.geolocation.getCurrentPosition(position => {
        const { latitude, longitude } = position.coords;
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`;
        fetch(url)
            .then(res => res.json())
            .then(data => {
                const state = data.address.state || data.address.city;
                const translatedState = translationDictionary[state] || state; // Jika terjemahan tidak ditemukan, gunakan teks asli
                stateProvince = translatedState;
            })
            .catch(() => {
                console.log("Error fetching data from API Nominatim");
            });
    });
});

function gantiGambar(dataURL) {
    const imgElements = document.querySelectorAll(".img-change");
    imgElements.forEach((imgElement) => {
        imgElement.setAttribute("src", dataURL);
    });
}

document.getElementById("input-image").addEventListener("change", function () {
    const uploadedFile = this.files[0]; // Mengambil file yang diunggah pertama kali
    const fileName = uploadedFile.name; // Mendapatkan nama file

    // Simpan nama file di Local Storage
    localStorage.setItem("uploaded-file-name", fileName);

    const reader = new FileReader();
    reader.addEventListener("load", () => {
        localStorage.setItem("image-detection", reader.result);
        gantiGambar(reader.result);
        location.reload();
    });

    reader.readAsDataURL(uploadedFile);
});

const noneDetect = document.getElementById("none-detect");
const loadDetect = document.getElementById("load-detect");

document.addEventListener("DOMContentLoaded", () => {
    const recentImageDataUrl = localStorage.getItem("image-detection");
    if (recentImageDataUrl) {
        gantiGambar(recentImageDataUrl);
        noneDetect.style.display = "none";
        detectObjects(recentImageDataUrl);
    } else {
        loadDetect.style.display = "none";
        noneDetect.style.display = "block";
    }

    const recentFileName = localStorage.getItem("uploaded-file-name");
    if (recentFileName) {
        const fileName = document.getElementById('file-name');
        fileName.textContent = recentFileName
    }
});

function detectObjects(imageDataUrl) {
    let img = document.getElementById("img-view");

    roboflow.auth({
        publishable_key: "rf_r1CAhU1Q3m2Sx3d2V0qT"
    });
    roboflow.load({
        model: "rice_quality",
        version: 29,
    }).then(model => {
        model.configure({
            threshold: 0.5,
            overlap: 0.5,
            max_objects: 50
        });
        model.detect(img).then(predictions => {
            const endTime = performance.now();
            const detectionTimeMs = endTime - startTime;
            const detectionTimeSec = (detectionTimeMs / 1000).toFixed(2); // Konversi ke detik
            var responseTime = document.getElementById("response-time");
            responseTime.textContent = detectionTimeSec;

            globalPredictions = predictions;
            document.getElementById("table-json").innerHTML = renderTable(predictions);
            document.getElementById("image-box-view").innerHTML = renderBox(predictions);
            document.getElementById("image-box").innerHTML = renderBox(predictions);
            document.getElementById("over-data").innerHTML = renderData(predictions);
            document.getElementById("over-bar").innerHTML = renderBar(predictions);

            // Ikhtisar Identifikasi
            var numPredictions = predictions.length;
            var objectCount = document.querySelector(".overview-container span"),
                objectSpan = document.querySelector(".content-head-subtitle span"),
                objectNum = document.querySelector(".object-num"),
                grainsNum = document.querySelector(".grains-num"),
                countGrains = 0;
            objectCount.textContent = numPredictions;
            objectSpan.textContent = numPredictions;
            objectNum.textContent = numPredictions;
            predictions.forEach(function (prediction) {
                var className = prediction.class;
                if (className.startsWith("butir_")) {
                    countGrains++;
                }
            });
            grainsNum.textContent = countGrains;

            // KATEGORI
            var kategoriInfo = [];

            predictions.forEach(function (prediction) {
                var kategori = prediction.class;
                var existingCategory = kategoriInfo.find(function (info) {
                    return info.kategori === kategori;
                });

                if (!existingCategory) {
                    kategoriInfo.push({
                        kategori: kategori,
                        count: 1,
                        class: prediction.class,
                    });
                } else {
                    existingCategory.count++;
                }
            });

            var totalCount = kategoriInfo.reduce(function (total, info) {
                return total + info.count;
            }, 0);

            kategoriInfo.forEach(function (info) {
                info.percentage = (info.count / totalCount) * 100;
            });

            // INFORMASI TAMBAHAN
            // Mendapatkan referensi ke elemen-elemen HTML yang diperlukan
            const segmentInput = document.getElementsByName("segment-input");
            const waterInput = document.querySelector(".water-input-list input[type='number']");
            const substanceInput = document.getElementsByName("substance-input");
            const smellInput = document.getElementsByName("smell-input");
            const degreeInput = document.getElementById("degree-input");
            const saveInfo = document.getElementById("save-info");

            var provinsiInput = document.getElementById("province-input");
            provinsiInput.value = stateProvince;

            // Fungsi untuk memeriksa dan inisialisasi data di localStorage jika belum ada
            function initializeData() {
                const storedData = localStorage.getItem("data");
                if (!storedData) {
                    // Jika data belum ada di localStorage, inisialisasi dengan nilai dari input HTML
                    const selectedSegment = Array.from(segmentInput).find(input => input.checked).value;
                    const selectedProvince = provinsiInput.value;
                    const waterPercentage = waterInput.value;
                    const selectedSubstance = Array.from(substanceInput).find(input => input.checked).value;
                    const selectedSmell = Array.from(smellInput).find(input => input.checked).value;
                    const degreeValue = degreeInput.value;

                    const data = {
                        segment: selectedSegment,
                        province: selectedProvince,
                        waterPercentage: waterPercentage,
                        substance: selectedSubstance,
                        smell: selectedSmell,
                        degree: degreeValue
                    };

                    // Menyimpan data awal di dalam localStorage
                    localStorage.setItem("data", JSON.stringify(data));
                }
            }

            // Panggil fungsi untuk memeriksa dan inisialisasi data saat halaman dimuat
            initializeData();

            // Fungsi untuk memuat data awal dari localStorage
            function loadInitialData() {
                const storedData = localStorage.getItem("data");
                if (storedData) {
                    const data = JSON.parse(storedData);

                    // Mengisi formulir dengan data awal
                    provinsiInput.value = data.province;
                    waterInput.value = data.waterPercentage;
                    degreeInput.value = data.degree;
                    Array.from(segmentInput).forEach(input => {
                        if (input.value === data.segment) {
                            input.checked = true;
                        }
                    });
                    Array.from(substanceInput).forEach(input => {
                        if (input.value === data.substance) {
                            input.checked = true;
                        }
                    });
                    Array.from(smellInput).forEach(input => {
                        if (input.value === data.smell) {
                            input.checked = true;
                        }
                    });

                    // Tooltip harga
                    document.getElementById("segment-tooltip").textContent = data.segment;
                    document.getElementById("province-tooltip").textContent = data.province;
                }
            }

            // Panggil fungsi untuk memuat data awal saat halaman dimuat
            loadInitialData();

            saveInfo.addEventListener("click", function () {
                // Mendapatkan nilai dari masing-masing input setiap kali tombol "Simpan" ditekan
                const selectedSegment = Array.from(segmentInput).find(input => input.checked).value;
                const selectedProvince = provinsiInput.value;
                const waterPercentage = waterInput.value;
                const selectedSubstance = Array.from(substanceInput).find(input => input.checked).value;
                const selectedSmell = Array.from(smellInput).find(input => input.checked).value;
                const degreeValue = degreeInput.value;

                // Membuat objek untuk menyimpan nilai-nilai
                const data = {
                    segment: selectedSegment,
                    province: selectedProvince,
                    waterPercentage: waterPercentage,
                    substance: selectedSubstance,
                    smell: selectedSmell,
                    degree: degreeValue
                };

                // Menyimpan data di dalam localStorage
                localStorage.setItem("data", JSON.stringify(data));
                window.location.reload();
            });

            const storedData = localStorage.getItem("data");
            const dataInfo = JSON.parse(storedData);
            let degreeDataInfo = dataInfo.degree;
            let provinceDataInfo = dataInfo.province;
            let segmentDataInfo = dataInfo.segment;
            let smellDataInfo = dataInfo.smell;
            let substanceDataInfo = dataInfo.substance;
            let waterDataInfo = dataInfo.waterPercentage;

            // KADAR AIR, ZAT KONTAMINAN, BAU BERAS
            var airContent = document.querySelector('#air-content'),
                contaminants = document.querySelector('#contaminants'),
                smellRice = document.querySelector('#smell-rice'),
                degreeFigure = document.querySelector('#degree-figure');

            if (!waterDataInfo) {
                waterDataInfo = "-";
            }
            airContent.textContent = waterDataInfo;
            contaminants.textContent = substanceDataInfo;
            smellRice.textContent = smellDataInfo;
            degreeFigure.textContent = degreeDataInfo + "%";

            // PENENTUAN KETEGORI SESUAI SYARAT KHUSUS
            var kategoriAkhir = "Bawah"; // Default "bawah"

            var kepalaPercentage = kategoriInfo.find(info => info.kategori === "butir_kepala")?.percentage || 0;
            var patahPercentage = kategoriInfo.find(info => info.kategori === "butir_patah")?.percentage || 0;
            var menirPercentage = kategoriInfo.find(info => info.kategori === "butir_menir")?.percentage || 0;
            var merahPercentage = kategoriInfo.find(info => info.kategori === "butir_merah")?.percentage || 0;
            var rusakPercentage = kategoriInfo.find(info => info.kategori === "butir_rusak")?.percentage || 0;
            var kapurPercentage = kategoriInfo.find(info => info.kategori === "butir_kapur")?.percentage || 0;
            var gabahCount = kategoriInfo.find(info => info.kategori === "butir_gabah")?.count || 0;
            // Benda Asing
            var sekamPercentage = kategoriInfo.find(info => info.kategori === "sekam")?.percentage || 0;
            var kutuPercentage = kategoriInfo.find(info => info.kategori === "kutu")?.percentage || 0;
            var batuPercentage = kategoriInfo.find(info => info.kategori === "batu")?.percentage || 0;

            // Syarat Komponen Mutu
            var isPremium =
                kepalaPercentage >= 85 &&
                patahPercentage <= 14.50 &&
                menirPercentage <= 0.50 &&
                merahPercentage <= 0.50 &&
                rusakPercentage <= 0.50 &&
                kapurPercentage <= 0.50 &&
                // Benda Asing
                sekamPercentage <= 0.01 &&
                kutuPercentage <= 0.01 &&
                batuPercentage <= 0.01 &&
                // Gabah
                gabahCount <= 1;
            var isMedium1 =
                kepalaPercentage >= 80 &&
                patahPercentage <= 18 &&
                menirPercentage <= 2 &&
                merahPercentage <= 2 &&
                rusakPercentage <= 2 &&
                kapurPercentage <= 2 &&
                // Benda Asing
                sekamPercentage <= 0.02 &&
                kutuPercentage <= 0.02 &&
                batuPercentage <= 0.02 &&
                // Gabah
                gabahCount <= 2;
            var isMedium2 =
                kepalaPercentage >= 75 &&
                patahPercentage <= 22 &&
                menirPercentage <= 3 &&
                merahPercentage <= 3 &&
                rusakPercentage <= 3 &&
                kapurPercentage <= 3 &&
                // Benda Asing
                sekamPercentage <= 0.03 &&
                kutuPercentage <= 0.03 &&
                batuPercentage <= 0.03 &&
                // Gabah
                gabahCount <= 3;

            switch (true) {
                case isPremium:
                    kategoriAkhir = "Premium";
                    break;
                case isMedium1:
                    kategoriAkhir = "Medium I";
                    break;
                case isMedium2:
                    kategoriAkhir = "Medium II";
                    break;
            }

            var classCategory = document.querySelector("#class-category");
            classCategory.textContent = kategoriAkhir;

            // Toottip kualitas di harga
            document.getElementById("quality-tooltip").textContent = kategoriAkhir;

            // Objek untuk menyimpan informasi penanganan kualitas beras
            var issues = {
                default: {
                    title: "",
                    content: "",
                    category: ""
                },
                kepala: {
                    title: "",
                    content: "",
                    category: ""
                },
                patah: {
                    title: "",
                    content: "",
                    category: ""
                },
                menir: {
                    title: "",
                    content: "",
                    category: ""
                },
                merah: {
                    title: "",
                    content: "",
                    category: ""
                },
                rusak: {
                    title: "",
                    content: "",
                    category: ""
                },
                kapur: {
                    title: "",
                    content: "",
                    category: ""
                },
                gabah: {
                    title: "",
                    content: "",
                    category: ""
                },
                bendaAsing: {
                    title: "",
                    content: "",
                    category: ""
                }
            };

            if (kategoriAkhir === "Premium") {
                classCategory.classList.add("class-premium");

                var issuesCont = document.getElementById("issuesSection");
                issuesCont.style.display = "none";
            } else if (kategoriAkhir === "Medium I") {
                classCategory.classList.add("class-medium-i");

                var classIssues = document.getElementById("class-issue");
                classIssues.textContent = kategoriAkhir;
                classIssues.classList.add("class-medium-i");


                var titleIssues = document.getElementById("issuesTitle");
                titleIssues.textContent = "Rekomendasi Penanganan Kualitas";

                // Mengisi informasi isu-isu sesuai dengan kondisi
                issues.default.title = "";
                issues.default.content = "";
                issues.default.category = "";

                if (kepalaPercentage >= 80 && kepalaPercentage < 85) {
                    issues.kepala.title = "Butir kepala memenuhi standar kualitas";
                    issues.kepala.content = "Untuk kualitas mutu yang lebih baik, tingkatkan jumlah beras kepala, pastikan kadar air maksimal 14% sebelum penggilingan dan lakukan revitalisasi pada mesin penggiling gabah";
                    issues.kepala.category = "Info";
                }

                if (patahPercentage > 14.50 && patahPercentage <= 18) {
                    issues.patah.title = "Butir patah memenuhi standar kualitas";
                    issues.patah.content = "Untuk kualitas mutu yang lebih baik, kurangi jumlah butir patah, pastikan kadar air maksimal 14% sebelum penggilingan, lakukan revitalisasi pada mesin penggiling gabah, dan juga gunakan mesin length grader untuk memisahkan butir patah";
                    issues.patah.category = "Info"
                }

                if (menirPercentage <= 2 && menirPercentage > 0) {
                    issues.menir.title = "Butir menir memenuhi standar kualitas";
                    issues.menir.content = "Untuk kualitas mutu yang lebih baik, kurangi jumlah butir menir, pastikan kadar air maksimal 14% sebelum penggilingan, lakukan revitalisasi pada mesin penggiling gabah, dan juga gunakan mesin length grader untuk memisahkan butir menir";
                    issues.menir.category = "Info"
                }

                if (merahPercentage <= 2 && merahPercentage > 0) {
                    issues.merah.title = "Butir merah teridentifikasi dan memenuhi standar kualitas";
                    issues.merah.content = "Untuk kualitas mutu yang lebih baik, hindari tercampurnya beras dengan varietas beras merah";
                    issues.merah.category = "Info"
                }

                if (rusakPercentage <= 2 && rusakPercentage > 0) {
                    issues.rusak.title = "Butir rusak teridentifikasi dan memenuhi standar kualitas";
                    issues.rusak.content = "Untuk kualitas mutu yang lebih baik, pastikan proses pengeringan yang maksimal dan tepat waktu, hindari penyimpanan beras di tempat yang lembab, dan pastikan beras dikemas dengan baik";
                    issues.rusak.category = "Info"
                }

                if (kapurPercentage <= 2 && kapurPercentage > 0) {
                    issues.kapur.title = "Butir kapur teridentifikasi dan memenuhi standar kualitas";
                    issues.kapur.content = "Untuk kualitas mutu yang lebih baik, lakukan optimalisasi pada tahap budidaya dan upayakan pemanenan tepat waktu";
                    issues.kapur.category = "Info"
                }

                if (gabahCount <= 2 && gabahCount > 0) {
                    issues.gabah.title = "Butir gabah teridentifikasi dan memenuhi standar kualitas";
                    issues.gabah.content = "Untuk kualitas mutu yang lebih baik, pastikan kadar air maksimal 14% sebelum penggilingan dan lakukan penyortiran setelah penggilingan gabah";
                    issues.gabah.category = "Info"
                }

                if ((sekamPercentage <= 0.02 && sekamPercentage > 0) || (kutuPercentage <= 0.02 && kutuPercentage > 0) || (batuPercentage <= 0.02 && batuPercentage > 0)) {
                    issues.bendaAsing.title = "Benda asing teridentifikasi dan memenuhi standar kualitas";
                    issues.bendaAsing.content = "Untuk kualitas mutu yang lebih baik, lakukan penyortiran pada hasil panen/produksi gabah, pembersihan kotoran yang melekat, tingkatkan kehati-hatian pada penanganan, dan gunakan ventilasi yang baik pada tempat pengolahan";
                    issues.bendaAsing.category = "Info"
                }

            } else if (kategoriAkhir === "Medium II") {
                classCategory.classList.add("class-medium-ii");

                var classIssues = document.getElementById("class-issue");
                classIssues.textContent = kategoriAkhir;
                classIssues.classList.add("class-medium-ii");

                var titleIssues = document.getElementById("issuesTitle");
                titleIssues.textContent = "Rekomendasi Penanganan Kualitas";

                // Mengisi informasi isu-isu sesuai dengan kondisi
                issues.default.title = "";
                issues.default.content = "";
                issues.default.category = "";

                if (kepalaPercentage >= 75 && kepalaPercentage < 80) {
                    issues.kepala.title = "Butir kepala memenuhi standar kualitas";
                    issues.kepala.content = "Untuk kualitas mutu yang lebih baik, tingkatkan jumlah beras kepala, pastikan kadar air maksimal 14% sebelum penggilingan dan lakukan revitalisasi pada mesin penggiling gabah";
                    issues.kepala.category = "Info";
                }

                if (patahPercentage > 18 && patahPercentage <= 22) {
                    issues.patah.title = "Butir patah memenuhi standar kualitas";
                    issues.patah.content = "Untuk kualitas mutu yang lebih baik, kurangi jumlah butir patah, pastikan kadar air maksimal 14% sebelum penggilingan, lakukan revitalisasi pada mesin penggiling gabah, dan juga gunakan mesin length grader untuk memisahkan butir patah";
                    issues.patah.category = "Info"
                }

                if (menirPercentage <= 3 && menirPercentage > 0) {
                    issues.menir.title = "Butir menir memenuhi standar kualitas";
                    issues.menir.content = "Untuk kualitas mutu yang lebih baik, kurangi jumlah butir menir, pastikan kadar air maksimal 14% sebelum penggilingan, lakukan revitalisasi pada mesin penggiling gabah, dan juga gunakan mesin length grader untuk memisahkan butir menir";
                    issues.menir.category = "Info"
                }

                if (merahPercentage <= 3 && merahPercentage > 0) {
                    issues.merah.title = "Butir merah teridentifikasi dan memenuhi standar kualitas";
                    issues.merah.content = "Untuk kualitas mutu yang lebih baik, hindari tercampurnya beras dengan varietas beras merah";
                    issues.merah.category = "Info"
                }

                if (rusakPercentage <= 3 && rusakPercentage > 0) {
                    issues.rusak.title = "Butir rusak teridentifikasi dan memenuhi standar kualitas";
                    issues.rusak.content = "Untuk kualitas mutu yang lebih baik, pastikan proses pengeringan yang maksimal dan tepat waktu, hindari penyimpanan beras di tempat yang lembab, dan pastikan beras dikemas dengan baik";
                    issues.rusak.category = "Info"
                }

                if (kapurPercentage <= 3 && kapurPercentage > 0) {
                    issues.kapur.title = "Butir kapur teridentifikasi dan memenuhi standar kualitas";
                    issues.kapur.content = "Untuk kualitas mutu yang lebih baik, lakukan optimalisasi pada tahap budidaya dan upayakan pemanenan tepat waktu";
                    issues.kapur.category = "Info"
                }

                if (gabahCount <= 3 && gabahCount > 0) {
                    issues.gabah.title = "Butir gabah teridentifikasi dan memenuhi standar kualitas";
                    issues.gabah.content = "Untuk kualitas mutu yang lebih baik, pastikan kadar air maksimal 14% sebelum penggilingan dan lakukan penyortiran setelah penggilingan gabah";
                    issues.gabah.category = "Info"
                }

                if ((sekamPercentage <= 0.03 && sekamPercentage > 0) || (kutuPercentage <= 0.03 && kutuPercentage > 0) || (batuPercentage <= 0.03 && batuPercentage > 0)) {
                    issues.bendaAsing.title = "Benda asing teridentifikasi dan memenuhi standar kualitas";
                    issues.bendaAsing.content = "Untuk kualitas mutu yang lebih baik, lakukan penyortiran pada hasil panen/produksi gabah, pembersihan kotoran yang melekat, tingkatkan kehati-hatian pada penanganan, dan gunakan ventilasi yang baik pada tempat pengolahan";
                    issues.bendaAsing.category = "Info"
                }

            } else if (kategoriAkhir === "Bawah") {
                classCategory.classList.add("class-bawah");

                var classIssues = document.getElementById("class-issue");
                classIssues.textContent = kategoriAkhir;
                classIssues.classList.add("class-bawah");


                // Mengisi informasi isu-isu sesuai dengan kondisi
                issues.default.title = "Objek tidak memenuhi syarat";
                issues.default.content = "Berdasarkan Standar Nasional Indonesia (SNI) 6128:2020 mengenai beras, objek yang Anda deteksi tidak memenuhi standar serta tidak layak dikonsumsi";
                issues.default.category = "Error";

                if (kepalaPercentage >= 70 && kepalaPercentage < 75) {
                    issues.kepala.title = "Butir kepala tidak memenuhi standar kualitas";
                    issues.kepala.content = "Untuk meningkatkan jumlah beras kepala, pastikan kadar air maksimal 14% sebelum penggilingan dan lakukan revitalisasi pada mesin penggiling gabah";
                    issues.kepala.category = "Warning";
                } else if (kepalaPercentage < 70 && kepalaPercentage != 0) {
                    issues.kepala.title = "Butir kepala sangat jauh dari standar kualitas";
                    issues.kepala.content = "Untuk meningkatkan jumlah beras kepala, pastikan kadar air maksimal 14% sebelum penggilingan dan lakukan revitalisasi pada mesin penggiling gabah";
                    issues.kepala.category = "Warning";
                }

                if (patahPercentage > 22 && patahPercentage <= 27) {
                    issues.patah.title = "Butir patah melebihi batas maksimal standar kualitas";
                    issues.patah.content = "Untuk mengurangi jumlah butir patah, pastikan kadar air maksimal 14% sebelum penggilingan, lakukan revitalisasi pada mesin penggiling gabah, dan juga gunakan mesin length grader untuk memisahkan butir patah";
                    issues.patah.category = "Warning"
                } else if (patahPercentage > 27) {
                    issues.patah.title = "Butir patah jauh dari batas maksimal standar kualitas";
                    issues.patah.content = "Untuk mengurangi jumlah butir patah, pastikan kadar air maksimal 14% sebelum penggilingan, lakukan revitalisasi pada mesin penggiling gabah, dan juga gunakan mesin length grader untuk memisahkan butir patah";
                    issues.patah.category = "Warning"
                }

                if (menirPercentage > 3) {
                    issues.menir.title = "Butir menir tidak memenuhi batas maksimal standar kualitas";
                    issues.menir.content = "Untuk mengurangi jumlah butir menir, pastikan kadar air maksimal 14% sebelum penggilingan, lakukan revitalisasi pada mesin penggiling gabah, dan juga gunakan mesin length grader untuk memisahkan butir menir";
                    issues.menir.category = "Warning"
                }

                if (merahPercentage > 3) {
                    issues.merah.title = "Butir merah teridentifikasi";
                    issues.merah.content = "Hindari tercampurnya beras dengan varietas beras merah";
                    issues.merah.category = "Warning"
                }

                if (rusakPercentage > 3) {
                    issues.rusak.title = "Butir rusak teridentifikasi";
                    issues.rusak.content = "Pastikan proses pengeringan yang maksimal dan tepat waktu, hindari penyimpanan beras di tempat yang lembab, dan pastikan beras dikemas dengan baik";
                    issues.rusak.category = "Warning"
                }

                if (kapurPercentage > 3) {
                    issues.kapur.title = "Butir kapur teridentifikasi";
                    issues.kapur.content = "Lakukan optimalisasi pada tahap budidaya dan upayakan pemanenan tepat waktu";
                    issues.kapur.category = "Warning"
                }

                if (gabahCount > 3) {
                    issues.gabah.title = "Butir gabah teridentifikasi";
                    issues.gabah.content = "Pastikan kadar air maksimal 14% sebelum penggilingan dan lakukan penyortiran setelah penggilingan gabah";
                    issues.gabah.category = "Warning"
                }

                if (sekamPercentage > 0.03 || kutuPercentage > 0.03 || batuPercentage > 0.03) {
                    issues.bendaAsing.title = "Benda asing teridentifikasi";
                    issues.bendaAsing.content = "Lakukan penyortiran pada hasil panen/produksi gabah, pembersihan kotoran yang melekat, tingkatkan kehati-hatian pada penanganan, dan gunakan ventilasi yang baik pada tempat pengolahan";
                    issues.bendaAsing.category = "Warning"
                }

            }

            function populateIssues() {
                // Mendapatkan elemen kontainer isu
                var issuesContainer = document.querySelector(".issues-container");

                // Mengisi data isu dari objek issues
                for (var key in issues) {
                    if (issues.hasOwnProperty(key)) {
                        var issue = issues[key];

                        if (issue.title !== "" || issue.content !== "") {
                            var issueElement = document.createElement("div");
                            issueElement.classList.add("issue-data");
                            if (issue.category == "Info") {
                                issueElement.classList.add("issue-info");
                            } else if (issue.category == "Error") {
                                issueElement.classList.add("issue-error");
                            } else if (issue.category == "Warning") {
                                issueElement.classList.add("issue-warning");
                            }

                            var issueHead = document.createElement("div");
                            issueHead.classList.add("issue-data-head");

                            var issueHead2 = document.createElement("div");

                            var issueIcon = document.createElement("i");
                            if (issue.category == "Info") {
                                issueIcon.classList.add("ph-fill", "ph-info");
                            } else if (issue.category == "Error") {
                                issueIcon.classList.add("ph-fill", "ph-warning-circle");
                            } else if (issue.category == "Warning") {
                                issueIcon.classList.add("ph-fill", "ph-warning");
                            }

                            var issueTitle = document.createElement("p");
                            issueTitle.textContent = issue.title;

                            var issueArrow = document.createElement("i");
                            issueArrow.classList.add("ph-fill", "ph-caret-right");

                            var issueContent = document.createElement("div");
                            issueContent.classList.add("issue-data-content");

                            var issueContentDiv = document.createElement("div");

                            var issueContentText = document.createElement("p");
                            issueContentText.classList.add("text-sm");
                            issueContentText.textContent = issue.content;

                            issueContent.appendChild(issueContentDiv);
                            issueContent.appendChild(issueContentText);
                            issueHead2.appendChild(issueIcon);
                            issueHead2.appendChild(issueTitle);
                            issueHead.appendChild(issueHead2);
                            issueHead.appendChild(issueArrow);
                            issueElement.appendChild(issueHead);
                            issueElement.appendChild(issueContent);
                            issuesContainer.appendChild(issueElement);
                        }
                    }
                }
            }

            populateIssues();

            var classData = [];
            for (var i = 0; i < predictions.length; i++) {
                var prediction = predictions[i];
                var className = prediction.class;
                var classInfo = {
                    class: className,
                    degree: null
                };

                if (className !== "butir_gabah" && className !== "sekam" && className !== "kutu" && className !== "batu") {
                    classInfo.degree = degreeDataInfo;
                }

                classData.push(classInfo);
            }

            // console.log(classData);

            var classArray = classData.map(function (item) {
                var words = item.class.split('_');
                var formattedClass = words.map(function (word) {
                    return word.charAt(0).toUpperCase() + word.slice(1);
                });

                return formattedClass.join(' ');
            });
            var degreeArray = classData.map(function (item) {
                return item.degree;
            });

            // console.log(classArray);
            // console.log(degreeArray);

            let degree_options = {
                chart: {
                    height: 300,
                    type: "area",
                    fontFamily: 'SF Pro Text, sans-serif',
                    toolbar: {
                        show: false,
                        tools: {
                            download: false,
                            selection: false,
                            zoom: false,
                            zoomin: false,
                            zoomout: false,
                            pan: false,
                            reset: false,
                        },
                    },
                },
                colors: ["#84CC16"],
                dataLabels: {
                    enabled: false,
                },
                series: [
                    {
                        name: "Derajat sosoh",
                        data: degreeArray
                    }
                ],
                fill: {
                    type: "gradient",
                    gradient: {
                        shadeIntensity: 1,
                        opacityFrom: 0.5,
                        opacityTo: 0.5,
                    }
                },
                stroke: {
                    curve: 'straight',
                },
                yaxis: {
                    min: 0,
                    max: 100,
                    tickAmount: 5,
                },
                xaxis: {
                    // categories: classArray,
                    tooltip: {
                        enabled: false,
                    },
                },
                grid: {
                    borderColor: '#E5E7EB',
                },
                tooltip: {
                    y: {
                        formatter: function (value) {
                            return value !== null ? value + '%' : '-';
                        }
                    },
                    x: {
                        formatter: function (index) {
                            return classArray[index - 1];
                        }
                    },
                },
                annotations: {
                    yaxis: [
                        {
                            y: 95,
                            borderColor: '#84CC16',
                            strokeDashArray: 2,
                            label: {
                                offsetX: -12,
                                offsetY: 24,
                                borderColor: 'none',
                                style: {
                                    color: '#365314',
                                    background: '#BEF264',
                                    fontSize: '12px',
                                    padding: {
                                        left: 9,
                                        right: 9,
                                        top: 3,
                                        bottom: 3,
                                    },
                                },
                                text: 'Minimal: 95%',
                                borderRadius: 12
                            }
                        }
                    ]
                }
            };

            let degree = new ApexCharts(document.querySelector("#chart-degree"), degree_options);
            degree.render();

            // =============================================
            var classCounts = {};
            var selectedClassNames = ["butir_kepala", "butir_patah", "butir_menir"]; // Nama-nama className yang Anda inginkan

            predictions.forEach(function (prediction) {
                var className = prediction.class;
                var classId = prediction.color;

                if (selectedClassNames.includes(className)) {
                    if (classCounts.hasOwnProperty(className)) {
                        classCounts[className].count += 1;
                    } else {
                        classCounts[className] = {
                            count: 1,
                            color: classId
                        };
                    }
                }
            });

            // console.log(classCounts);

            var classNamesArray = [];
            var countsArray = [];
            var colorsArray = [];

            for (var className in classCounts) {
                if (classCounts.hasOwnProperty(className)) {
                    classNamesArray.push(className);
                    countsArray.push(classCounts[className].count);
                    colorsArray.push(classCounts[className].color);
                }
            }


            var classInfoArray = [];
            for (var className in classCounts) {
                if (classCounts.hasOwnProperty(className)) {
                    classInfoArray.push({
                        className: className,
                        count: classCounts[className].count,
                        color: classCounts[className].color
                    });
                }
            }

            classInfoArray.sort(function (a, b) {
                return b.count - a.count;
            });

            var sortedClassNamesArray = [];
            var sortedCountsArray = [];
            var sortedColorsArray = [];

            classInfoArray.forEach(function (info) {
                sortedClassNamesArray.push(info.className);
                sortedCountsArray.push(info.count);
                sortedColorsArray.push(info.color);
            });

            var sortedClassNamesArray = sortedClassNamesArray.map(function (className) {
                var words = className.split("_");
                for (var i = 0; i < words.length; i++) {
                    words[i] = words[i][0].toUpperCase() + words[i].slice(1);
                }
                return words.join(" ");
            });

            var grainsCountElement = document.querySelector("#grains-count");
            var dataTerbanyak = sortedClassNamesArray[0];
            grainsCountElement.textContent = dataTerbanyak;

            let grains_options = {
                chart: {
                    height: '380',
                    type: 'donut',
                    fontFamily: 'SF Pro Text, sans-serif',
                },
                colors: sortedColorsArray,
                dataLabels: {
                    dropShadow: {
                        enabled: false
                    },
                },
                legend: {
                    show: true,
                    position: 'bottom',
                    fontSize: '12px',
                    labels: {
                        colors: '#6B7280',
                    },
                    formatter: function (seriesName, opts) {
                        return ['<span class="legend-grains">' + seriesName + '</span>' + '<br>' + opts.w.globals.series[opts.seriesIndex] + ' butir beras']
                    },
                    markers: {
                        width: 4,
                        height: 33,
                        offsetX: -6,
                        offsetY: 1
                    },
                    itemMargin: {
                        horizontal: 16,
                        vertical: 8,
                    },
                    onItemClick: {
                        toggleDataSeries: true
                    },

                },
                series: sortedCountsArray,
                labels: sortedClassNamesArray,
                plotOptions: {
                    pie: {
                        donut: {
                            size: '60%',
                            labels: {
                                show: true,
                                value: {
                                    show: true,
                                    fontSize: '36px',
                                    fontFamily: 'SF Pro Display, sans-serif',
                                    color: undefined,
                                    offsetY: 16,
                                    formatter: function (val) {
                                        return val
                                    }
                                },
                                total: {
                                    show: true,
                                    showAlways: true,
                                    label: 'Butir beras',
                                    fontSize: '14px',
                                    color: '#6B7280',
                                    formatter: function (w) {
                                        return w.globals.seriesTotals.reduce((a, b) => {
                                            return a + b
                                        }, 0)
                                    }
                                },
                            }
                        }
                    }
                },
                tooltip: {
                    fillSeriesColor: false,
                }
            };

            let grains = new ApexCharts(document.querySelector("#chart-grains"), grains_options);
            grains.render();

            // HARGA BERAS
            var qualityCategory = document.querySelector("#class-category").textContent;
            var province = provinceDataInfo;
            var segment = segmentDataInfo;

            if (!province) {
                province = "Semua Provinsi";
            }

            var provinceData = dataHarga.find(function (data) {
                return data.provinsi === province;
            });

            var deteksiHarga = 0;

            if (provinceData) {
                var qualityData = provinceData.harga_pangan.find(function (item) {
                    return item.kualitas === qualityCategory;
                });

                if (qualityData) {
                    var priceData = qualityData.jenis.find(function (item) {
                        return item.segmentasi_pasar === segment;
                    });

                    if (priceData) {
                        deteksiHarga = priceData.harga;
                    }
                }
            }

            var formattedHarga = deteksiHarga.toLocaleString('id-ID');
            var priceNum = document.querySelector(".price-num");
            priceNum.textContent = formattedHarga;

            // LOADING
            const loadDetect = document.getElementById("load-detect");
            const completeDetect = document.getElementById("complete-detect");

            loadDetect.style.display = "none";
            completeDetect.style.display = "block";
        }).catch(error => {
            console.error(error);
        });
    }).catch(error => {
        console.error(error);
    });
}


function capitalizeClassName(className) {
    var words = className.split('_');
    for (var i = 0; i < words.length; i++) {
        words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
    }
    return words.join(' ');
}

function renderTable(data) {
    var tableHtml = "<table><thead>";
    tableHtml += "<tr class=\"text-xs\">";
    tableHtml += "<th data-sort onclick=\"sortTable(0, this)\">OBJEK</th>";
    tableHtml += "<th data-sort onclick=\"sortTable(1, this)\">SUMBU X</th>";
    tableHtml += "<th data-sort onclick=\"sortTable(2, this)\">SUMBU Y</th>";
    tableHtml += "<th data-sort onclick=\"sortTable(3, this)\">LEBAR</th>";
    tableHtml += "<th data-sort onclick=\"sortTable(4, this)\">TINGGI</th>";
    tableHtml += "<th data-sort onclick=\"sortTable(5, this)\">AKURASI</th>";
    tableHtml += "</tr></thead><tbody id=\"table-body\">";

    data.forEach(function (prediction, index) {
        var className = capitalizeClassName(prediction.class);
        var x = prediction.bbox.x / 1000 * 100;
        var y = prediction.bbox.y / 1000 * 100;
        var w = prediction.bbox.width / 1000 * 100;
        var h = prediction.bbox.height / 1000 * 100;
        var x1Box = x - (w / 2);
        var x2Box = x + (w / 2);
        var y1Box = y - (h / 2);
        var y2Box = y + (h / 2);
        var confidence = (prediction.confidence * 100).toFixed(0);
        const recentImageDataUrl = localStorage.getItem("image-detection");

        tableHtml += "<tr>";
        tableHtml += "<td class=\"table-data-primary\"><div></div><img src=\"" + recentImageDataUrl + "\"><img src=\"" + recentImageDataUrl + "\" class=\"crop-img\" style=\"clip-path: polygon(" + x1Box + "% " + y1Box + "%, " + x2Box + "% " + y1Box + "%, " + x2Box + "% " + y2Box + "%, " + x1Box + "% " + y2Box + "%);\">" + className + "</td > ";
        tableHtml += "<td>" + x.toFixed(2) + "%</td>";
        tableHtml += "<td>" + y.toFixed(2) + "%</td>";
        tableHtml += "<td>" + w.toFixed(2) + "%</td>";
        tableHtml += "<td>" + h.toFixed(2) + "%</td>";
        tableHtml += "<td>" + confidence + "%</td>";
        tableHtml += "</tr>";
    });

    tableHtml += "</tbody></table>";

    return tableHtml;
}

function renderBox(data) {
    var divBox = "";

    data.forEach(function (prediction, index) {
        var className = capitalizeClassName(prediction.class);
        var x = prediction.bbox.x / 1000 * 100;
        var y = prediction.bbox.y / 1000 * 100;
        var w = prediction.bbox.width / 1000 * 100;
        var h = prediction.bbox.height / 1000 * 100;
        var xBox = x - (w / 2);
        var yBox = y - (h / 2);
        var confidence = (prediction.confidence * 100).toFixed(0);

        divBox += "<div data-content=\"" + className + " (" + confidence + "%)\" style=\"top: " + yBox + "%; left: " + xBox + "%; width: " + w + "%; height:" + h + "%;\" class=\"box-color-" + prediction.class + "\">";
        divBox += "</div>";
    });

    return divBox;
}

function renderData(data) {
    var divData = "";
    var kategoriInfo = [];

    // Mengumpulkan informasi tentang setiap kategori
    data.forEach(function (prediction, index) {
        var kategori = prediction.class;
        var existingCategory = kategoriInfo.find(function (info) {
            return info.kategori === kategori;
        });

        if (!existingCategory) {
            kategoriInfo.push({
                kategori: kategori,
                count: 1,
                class: prediction.class,
            });
        } else {
            existingCategory.count++;
        }
    });

    // Mengurutkan kategori berdasarkan jumlah terbanyak
    kategoriInfo.sort(function (a, b) {
        return b.count - a.count;
    });

    // Menampilkan informasi kategori yang terkumpul
    kategoriInfo.forEach(function (info) {
        var persentase = ((info.count / data.length) * 100).toFixed(2);

        divData += "<div class=\"overview-data\">";
        divData += "<div class=\"overview-name\">";
        divData += "<div class=\"overview-circle circle-color-" + info.class + "\"></div>";
        divData += "<p class=\"text-sm\">" + capitalizeClassName(info.kategori) + "</p>";
        divData += "</div>";
        divData += "<p class=\"text-sm\">" + info.count + "</p>";
        divData += "<p class=\"text-sm\">" + persentase + "%</p>";
        divData += "</div>";
    });

    return divData;
}

function renderBar(data) {
    var divBar = "";
    var kategoriInfo = [];

    data.forEach(function (prediction, index) {
        var kategori = prediction.class;
        var existingCategory = kategoriInfo.find(function (info) {
            return info.kategori === kategori;
        });

        if (!existingCategory) {
            kategoriInfo.push({
                kategori: kategori,
                count: 1,
                class: prediction.class,
            });
        } else {
            existingCategory.count++;
        }
    });

    kategoriInfo.sort(function (a, b) {
        return b.count - a.count;
    });

    kategoriInfo.forEach(function (info) {
        var persentase = ((info.count / data.length) * 100).toFixed(2);
        divBar += "<div class=\"circle-color-" + info.class + "\" style=\"width: " + persentase + "%; \"></div>";
    });

    return divBar;
}

// =================================
// TANGGAL REAL TIME
var currentTime = new Date(),
    jam = currentTime.getHours(),
    menit = currentTime.getMinutes(),
    tanggal = currentTime.getDate(),
    bulan = currentTime.toLocaleString('default', { month: 'long' }),
    tahun = currentTime.getFullYear();

var jamFormatted = jam.toString().padStart(2, '0');
var menitFormatted = menit.toString().padStart(2, '0');

var waktuSekarang = jamFormatted + ":" + menitFormatted;
var tanggalFormat = tanggal + " " + bulan + " " + tahun;
var waktuDanTanggal = waktuSekarang + ", " + tanggalFormat;

var dateNow = document.querySelector("#date-now");
dateNow.textContent = waktuDanTanggal;