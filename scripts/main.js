// SEARCH BOX
const searchBox = document.querySelector('.search-box');
const searchInput = document.querySelector('.search-input');

searchBox.addEventListener('click', function () {
    searchInput.focus();
});

document.addEventListener('keydown', function (event) {
    if (event.ctrlKey && event.key === '/') {
        searchInput.focus();
    }
});

// SUB NAVBAR
const body = document.body;
let lastScroll = 0;

window.addEventListener("scroll", () => {
    const currentScroll = window.pageYOffset;
    if (currentScroll <= 0) {
        body.classList.remove("scroll-up");
        return;
    }

    if (currentScroll > lastScroll && !body.classList.contains("scroll-down")) {
        body.classList.remove("scroll-up");
        body.classList.add("scroll-down");
    } else if (currentScroll < lastScroll && body.classList.contains("scroll-down")) {
        body.classList.remove("scroll-down");
        body.classList.add("scroll-up");
    }
    lastScroll = currentScroll;
});

// TABLE SORT
function sortTable(n, evt) {
    var table = document.querySelector('table'),
        thead = document.querySelector('thead'),
        tbody = table.querySelector('tbody'),
        bRows = [...tbody.rows],
        hData = [...thead.querySelectorAll('th')],
        desc = false;

    hData.map((head) => {
        if (head != evt) {
            head.classList.remove('asc', 'desc');
        }
    });

    desc = evt.classList.contains('asc') ? true : false;
    evt.classList[desc ? 'remove' : 'add']('asc');
    evt.classList[desc ? 'add' : 'remove']('desc');

    tbody.innerHTML = '';
    bRows.sort((a, b) => {
        let x = a.getElementsByTagName('td')[n].innerHTML.toLowerCase(),
            y = b.getElementsByTagName('td')[n].innerHTML.toLowerCase();
        return desc ? (x < y ? 1 : -1) : (x < y ? -1 : 1);
    });
    bRows.map((bRow) => {
        tbody.appendChild(bRow);
    })
}

document.addEventListener("DOMContentLoaded", function () {
    const moreButton = document.getElementById("more-button");
    const buttonMore = document.getElementById("button-more");
    const downloadButton = document.querySelector("#button-more .button-icon:nth-child(1)");
    const shareButton = document.querySelector("#button-more .button-icon:nth-child(2)");
    const infoButton = document.querySelector("#button-more .button-icon:nth-child(3)");
    const reportButton = document.querySelector("#button-more .button-icon:last-child");

    moreButton.addEventListener("click", function () {
        buttonMore.classList.toggle("more-hidden");
    });

    // Menutup buttonMore ketika salah satu tombol ditekan
    function closeButtonMore() {
        buttonMore.classList.add("more-hidden");
    }

    downloadButton.addEventListener("click", closeButtonMore);
    shareButton.addEventListener("click", closeButtonMore);
    infoButton.addEventListener("click", closeButtonMore);
    reportButton.addEventListener("click", closeButtonMore);

    document.addEventListener("click", function (event) {
        if (!moreButton.contains(event.target) && !buttonMore.contains(event.target)) {
            buttonMore.classList.add("more-hidden");
        }
    });
});


// MODAL
const modalContainer = document.querySelector(".modal-container"),
    imageModal = document.querySelector(".image-modal"),
    imageOver = document.querySelector(".image-over"),
    modalContainer2 = document.querySelector(".modal-container-2"),
    modalInfo = document.querySelector(".modal-info"),
    addInfo = document.querySelector("#add-info"),
    closeInfo = document.querySelector("#close-info"),
    closeInfo2 = document.querySelector("#close-info-2");

imageOver.addEventListener("click", () => modalContainer.classList.add("active"));
addInfo.addEventListener("click", () => modalContainer2.classList.add("active"));

imageModal.addEventListener("click", (e) => {
    e.stopPropagation();
});

modalInfo.addEventListener("click", (e) => {
    e.stopPropagation();
});

modalContainer.addEventListener("click", () =>
    modalContainer.classList.remove("active")
);

modalContainer2.addEventListener("click", () =>
    modalContainer2.classList.remove("active")
);

closeInfo.addEventListener("click", () =>
    modalContainer2.classList.remove("active")
);

closeInfo2.addEventListener("click", () =>
    modalContainer2.classList.remove("active")
);

// DEGREE RANGE
const sliderValue = document.querySelector('#degree-range');
const inputSlider = document.querySelector('#degree-input');

inputSlider.oninput = (() => {
    let value = inputSlider.value;
    sliderValue.textContent = value;
    sliderValue.style.left = (value) + "%";
    sliderValue.classList.add("show");
});

inputSlider.onblur = (() => {
    sliderValue.classList.remove("show");
});

