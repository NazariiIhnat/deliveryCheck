// const invoiceObjExample = {
//     invoiceNumber: "123",
//     itemList: [
//       { ean: 111, quantity: 1, actualQuantity: 0 },
//       { ean: 222, quantity: 2, actualQuantity: 0 },
//       { ean: 333, quantity: 3, actualQuantity: 0 },
//     ],
//   },

const eanInputEl = document.querySelector(".ean-input");
const spinerEl = document.querySelector(".spinner");
const formEl = document.querySelector("form");
const tablesContainerEl = document.querySelector(".tables-container");
const overlayEL = document.querySelector(".overlay");
const dropZoneEl = document.querySelector(".drop-zone");

/**
 * Store all invoice objects;
 */
const data = [];

/**
 * Generates and render table according to invoice obj
 * @param {invoice} Invoice Recives invoice object as shown at the top of file
 */
const createInvoiceTable = function (invoice) {
  const html = `
  <div class="table-box" id="${invoice.invoiceNumber}">
        <h1 class="table-header">Invoice: ${invoice.invoiceNumber}</h1>
        <table>
          <tr>
            <th>№</th>
            <th>EAN</th>
            <th>Quantity</th>
            <th>Actual quantity</th>
          </tr>
          ${generateDataRows(invoice)}
          </table>
      </div>
  `;
  tablesContainerEl.insertAdjacentHTML("afterBegin", html);
};

/**
 * Conver invoice object to String of HTML code of single row of item.
 * @param {invoice} Invoice Recives invoice object as shown at the top of file.
 * @returns String of HTML code for single row of item.
 */
const generateDataRows = function (invoice) {
  const html = invoice.itemList.reduce((acc, val, index) => {
    acc += `<tr id="ean-${val.ean}">
        <td class="table__index">${index + 1}</td>
        <td class="table__ean">${val.ean}</td>
        <td class="table__quantity">${val.quantity}</td>
        <td class="table__actual-quantity">${val.actualQuantity}</td>
      </tr>`;
    return acc;
  }, "");
  return html;
};

/**
 * Find necessary item and update actual quantity after enter key pressed or barcode of item is scanned. The ipdate happend only if item pass all conditions
 */
formEl.addEventListener("keypress", (e) => {
  if (e.key === "Enter") {
    let ean = eanInputEl.value;
    let quantity = spinerEl.value;
    if (ean.length !== 13) {
      alert("Error! EAN-13 code must have 13 digits.");
      return;
    }
    if (!isDigit(ean)) {
      alert("Error! EAN-13 code must include digits only.");
      return;
    }
    if (quantity < 1) {
      alert("Error! Quantity must be greather than 0.");
      return;
    }
    if (!isDigit(quantity)) {
      alert("Error! Bad quantity format.");
      return;
    }
    quantity = +quantity;

    let itemIsPresent = false;

    data.forEach((invoice) => {
      const items = invoice.itemList.filter((item) => item.ean === ean);
      if (items.length > 0) itemIsPresent = true;
      if (!items && !itemIsPresent) return;

      items.forEach((item) => {
        if (!quantity) return;

        if (item.quantity === item.actualQuantity) return;
        const index = invoice.itemList.indexOf(item);
        const maxQuantityThatItemCanAccept =
          item.quantity - item.actualQuantity;

        // Add quantity to items actual quantity. After execution of this block quantity = 0, item.quantity < item.actualQuantity.
        if (quantity < maxQuantityThatItemCanAccept) {
          item.actualQuantity += quantity;
          quantity = 0;
          updateInvoiceItemQuantityEl(
            invoice.invoiceNumber,
            index,
            item.actualQuantity
          );
        }

        // Add quantity to items actual quantity and set background of item green. After execution of this block quantity = 0, item.quantity = item.actualQuantity.
        if (quantity === maxQuantityThatItemCanAccept) {
          item.actualQuantity += quantity;
          quantity = 0;
          updateInvoiceItemQuantityEl(
            invoice.invoiceNumber,
            index,
            item.actualQuantity,
            true
          );
        }

        //Add quantity to item actual quantity and set background of item green. After execution of this block quantity != 0, item.quantity = item.actualQuantity.
        if (quantity > maxQuantityThatItemCanAccept) {
          item.actualQuantity += maxQuantityThatItemCanAccept;
          quantity -= maxQuantityThatItemCanAccept;
          updateInvoiceItemQuantityEl(
            invoice.invoiceNumber,
            index,
            item.actualQuantity,
            true
          );
        }

        // Add quantity to item actual quantity and set background of item red. After execution of this block quantity = 0, item.quantity < item.actualQuantity.
        console.log(items.indexOf(item), items.length);
        if (
          quantity &&
          items.indexOf(item) === items.length - 1 &&
          data.indexOf(invoice) === data.length - 1
        ) {
          item.actualQuantity += quantity;
          quantity = 0;
          updateInvoiceItemQuantityEl(
            invoice.invoiceNumber,
            index,
            item.actualQuantity,
            false,
            true
          );
        }
      });
    });
    if (!itemIsPresent) alert(`Error! No item with code ${ean}`);
    eanInputEl.value = "";
  }
});

/**
 * Check if input string if digit.
 * @param {input} String of digit.
 * @returns true if String is digit.
 */
const isDigit = function (input) {
  return /^\d+$/.test(input);
};

/**
 * Update quantity and background color of specific item of cpecific invoice.
 * @param {*} String number of invoce.
 * @param {*} Number index of item in invoice.
 * @param {*} Number quantity to set.
 * @param {*} Boolean if true paint row background of item green. Default false.
 * @param {*} paintRed if true paint row background of item red. Default false.
 */
const updateInvoiceItemQuantityEl = function (
  invoiceNum,
  index,
  quantity,
  paintGreen = false,
  paintRed = false
) {
  const invoiceEl = document.getElementById(`${invoiceNum}`);
  const rowEl = invoiceEl.querySelectorAll(`tr`)[index + 1];
  rowEl.querySelector(".table__actual-quantity").textContent = quantity;
  if (paintGreen) rowEl.classList.add("highlight-green");
  if (paintRed) rowEl.classList.add("highlight-red");
};

/**
 * Open file select dialog by clicking on drop zone and create tables of invoices in browser.
 */
dropZoneEl.addEventListener("click", async (e) => {
  const files = await loadFiles();
  files.forEach(async (file) => {
    const invoice = await getInvoiceObjFromFile(file);
    data.push(invoice);
    createInvoiceTable(invoice);
  });
  overlayEL.classList.add("hidden");
});

/**
 * Load .csv files and returns Array of file objects.
 * @returns Array of file objects.
 */
async function loadFiles() {
  let input = document.createElement("input");
  input.type = "file";
  input.multiple = true;
  input.accept = ".csv";
  input.click();
  return new Promise((resolve) => {
    input.onchange = () => {
      resolve(Array.from(input.files));
    };
  });
}

/**
 * Recives .csv file and parse it into invoice object as shown at the top op file.
 * @param {file} File to be parsed.
 * @returns Invoice object.
 */
function getInvoiceObjFromFile(file) {
  return new Promise((resolve) => {
    Papa.parse(file, {
      header: true,
      escapeChar: "№",
      complete: function (results) {
        const itemList = results.data.map((item) => {
          return {
            ean: item.ean,
            quantity: item.quantity,
            actualQuantity: 0,
          };
        });
        const invoice = { invoiceNumber: file.name, itemList };
        resolve(invoice);
      },
    });
  });
}

/**
 * Prevent default behaviour of onDragOver event.
 */
dropZoneEl.addEventListener("dragover", (event) => {
  event.preventDefault();
});

/**
 * Open file by dropping them on drop zone and create tables of invoices in browser.
 */
dropZoneEl.addEventListener("drop", async (event) => {
  event.preventDefault();
  const files = event.dataTransfer.files;
  Object.entries(files).forEach(async (key) => {
    const file = key[1];
    const invoiceObj = await getInvoiceObjFromFile(file);
    data.push(invoiceObj);
    createInvoiceTable(invoiceObj);
  });
  overlayEL.classList.add("hidden");
});
