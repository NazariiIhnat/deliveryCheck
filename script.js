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
const invoicesContainerEl = document.querySelector(".invoice-container");
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
  <div class="invoice-box" id="${invoice.invoiceNumber}">
        <h1 class="invoice-header">Invoice: ${invoice.invoiceNumber}</h1>
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
  invoicesContainerEl.insertAdjacentHTML("afterBegin", html);
};

/**
 * Conver invoice object to String of HTML code of single row of item.
 * @param {invoice} Invoice Recives invoice object as shown at the top of file.
 * @returns String of HTML code for single row of item.
 */
const generateDataRows = function (invoice) {
  const html = invoice.itemList.reduce((acc, val, index) => {
    acc += `<tr id="ean-${val.ean}">
        <td class="invoice__index">${index + 1}</td>
        <td class="invoice__ean">${val.ean}</td>
        <td class="invoice__quantity">${val.quantity}</td>
        <td class="invoice__actual-quantity">${val.actualQuantity}</td>
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

    const invoices = getInvoiceWichHasItemsWithGivenEan(ean);

    invoices.forEach((invoice) => {
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
        if (
          quantity &&
          items.indexOf(item) === items.length - 1 &&
          invoices.indexOf(invoice) === invoices.length - 1
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
        scrollIntoLineOfInvoice(invoice, index);
      });
    });
    if (!itemIsPresent) alert(`Error! No item with code ${ean}`);
    eanInputEl.value = "";
  }
});

/**
 * Find all invoices that have ite with given EAN code.
 * @param {ean} String representation of item EAN code.
 * @returns Array of invoices that includes specific item.
 */
function getInvoiceWichHasItemsWithGivenEan(ean) {
  return data.reduce((acc, invoice) => {
    const items = invoice.itemList.filter((item) => item.ean === ean);
    if (items.length != 0) acc.push(invoice);
    return acc;
  }, []);
}

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
 * @param {invoiceNum} String number of invoce.
 * @param {index} Number index of item in invoice.
 * @param {quantity} Number quantity to set.
 * @param {paintGreen} Boolean if true paint row background of item green. Default false.
 * @param {paintRed} Boolean if true paint row background of item red. Default false.
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
  rowEl.querySelector(".invoice__actual-quantity").textContent = quantity;
  if (paintGreen) rowEl.classList.add("highlight-green");
  if (paintRed) rowEl.classList.add("highlight-red");
};

/**
 * Scrool into view of scpeific invoice of cpecific line.
 * @param {invoice} Invoice which include item.
 * @param {line} Number of line to be scrooled into view.
 */
const scrollIntoLineOfInvoice = function (invoice, line) {
  const invoiceEl = document.getElementById(invoice.invoiceNumber);
  const lines = invoiceEl.getElementsByTagName("tr");
  lines[line].scrollIntoView(true);
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
