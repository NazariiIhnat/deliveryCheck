const eanInputEl = document.querySelector(".ean-input");
const spinerEl = document.querySelector(".spinner");
const formEl = document.querySelector("form");
const tablesContainerEl = document.querySelector(".tables-container");
const overlayEL = document.querySelector(".overlay");
const dropZoneEl = document.querySelector(".drop-zone");

const data = [];

//   {
//     invoiceNumber: "123",
//     itemList: [
//       { ean: 111, quantity: 1, actualQuantity: 0 },
//       { ean: 222, quantity: 2, actualQuantity: 0 },
//       { ean: 333, quantity: 3, actualQuantity: 0 },
//     ],
//   },
//   {
//     invoiceNumber: "456",
//     itemList: [
//       { ean: 111, quantity: 1, actualQuantity: 0 },
//       { ean: 444, quantity: 10, actualQuantity: 0 },
//       { ean: 555, quantity: 5, actualQuantity: 0 },
//       { ean: 666, quantity: 6, actualQuantity: 0 },
//       { ean: 444, quantity: 4, actualQuantity: 0 },
//     ],
//   },
// ];

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

const loadDataFromCSV = function () {
  if (data.length === 0) return;
  data.forEach((invoice) => createInvoiceTable(invoice));
};

loadDataFromCSV();

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
        const index = invoice.itemList.indexOf(item);
        const maxQuantityThatItemCanAccept =
          item.quantity - item.actualQuantity;

        if (quantity < maxQuantityThatItemCanAccept) {
          item.actualQuantity += quantity;
          quantity = 0;
          updateInvoiceItemQuantityEl(
            invoice.invoiceNumber,
            index,
            item.actualQuantity
          );
        }

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

const isDigit = function (input) {
  return /^\d+$/.test(input);
};

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

dropZoneEl.addEventListener("click", async (e) => {
  const files = await loadFiles();
  files.forEach(async (file) => {
    const invoice = await getInvoiceObjFromFile(file);
    data.push(invoice);
    createInvoiceTable(invoice);
  });
  overlayEL.classList.add("hidden");
});

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
        // data.push(invoice);
        // createInvoiceTable(invoice);
        // overlayEL.classList.add("hidden");
      },
    });
  });
}
