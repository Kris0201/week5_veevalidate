// 1-1 建立元件：引入 Vue 函式庫
import { createApp } from "https://cdnjs.cloudflare.com/ajax/libs/vue/3.2.45/vue.esm-browser.min.js";

const apiUrl = 'https://vue3-course-api.hexschool.io';
const apiPath = 'kris-api';

// 表單驗證：VeeValidate 規則載入
Object.keys(VeeValidateRules).forEach(rule => {
    if (rule !== 'default') {
      VeeValidate.defineRule(rule, VeeValidateRules[rule]);
    }
  });

// 多國語系
// 讀取外部的資源
VeeValidateI18n.loadLocaleFromURL('./zh_TW.json');

// Activate the locale
VeeValidate.configure({
  generateMessage: VeeValidateI18n.localize('zh_TW'),
  validateOnInput: true, // 調整為：輸入文字時，就立即進行驗證
});




// 製作「查看更多」彈出視窗
// var myModal = new bootstrap.Modal(document.getElementById('myModal'), options) // modal 實體化生成原生 js 語法

const productModal = {
    // 取得遠端資料，在 Modal 元件執行
    // 當 id 變動時，取得遠端資料，並呈現 Modal
    props: ['id', 'addToCart', 'openModal'],
    data() {
        return {
            modal: {}, // modal 實體化後的生成位置
            tempProduct: {},
            qty: 1

        }
    },
    template: `#userProductModal`,
    watch: { // 用 watch 監聽 props 傳入的值 (id) 是否有變動
        id() {
            if(this.id){
                // 因為 id 會被清空，因此要加一個判斷式來保證在有 id 的情況下才打 api，沒有 id 就不管它
                axios.get(`${apiUrl}/v2/api/${apiPath}/product/${this.id}`)
                    .then((res) => {
                        // console.log('單一產品',res.data.product);
                        this.tempProduct = res.data.product;
                        this.modal.show()
                        // console.log('productModal:', this.id) // 查看點擊按鈕後有無傳入外層的 id
                    })
            }

        }
    },
    methods: {
        hide() {
            this.modal.hide()
        }
    },

    mounted() {
        // 一載入頁面就生成 modal 元件
        // 使用 this.$refs 來取得 DOM ，並將生成後的 modal 賦予到 this.modal 變數上
        this.modal = new bootstrap.Modal(this.$refs.modal)

        // 監聽 DOM，當 modal 關閉時，清空 id，避免因為重複點擊相同產品的「查看更多」時，由於 id 沒有變動而打不開 modal 的狀況
        this.$refs.modal.addEventListener('hidden.bs.modal', (event) => {
            console.log('modal 被關閉了')
            this.openModal(''); // 透過傳入 openModal 函式來清空 id (因為 id 是外部傳入的，不能直接改)
        })

    }
}



const app = createApp({
    data() {
        return {
            products: [],
            productId: '', // 被點擊「查看更多」的產品的 id
            cart: {},
            loadingItem: '', // 存 id，控制是否 disabled 選單
        }
    },
    methods: {
        getProducts() {
            axios.get(`${apiUrl}/v2/api/${apiPath}/products/all`)
                .then((res) => {
                    // console.log('產品列表', res.data.products)
                    this.products = res.data.products;

                })
        },
        openModal(id) {
            this.productId = id;
            console.log('外層帶入 productId', id)

        },

        addToCart(product_id, qty = 1) {
            const data = {
                product_id,
                qty
            }

            axios.post(`${apiUrl}/v2/api/${apiPath}/cart`, { data })
                .then((res) => {
                    console.log('加入購物車', res.data)
                    this.$refs.productModal.hide()
                    // 點擊 modal 中的「加入購物車」後即關閉 modal

                    this.getCarts(); //每次加入購物車，就更新購物車中的品項 ( getCarts() )
                })

        },

        // 取得「加入到購物車中的品項」
        getCarts() {
            axios.get(`${apiUrl}/v2/api/${apiPath}/cart`)
                .then((res) => {
                    console.log('購物車', res.data)
                    this.cart = res.data.data;

                })
        },

        // 調整數量
        updateCartItem(item) {
            // 購物車的 id & 產品的 id
            const data = {
                product_id: item.product.id, // 產品 id
                qty: item.qty,
            }
            // console.log(data, item.id)

            this.loadingItem = item.id; // this.loadingItem 原為空值，change 選單中的數量 (購物車品項的數量) 有改變時，將 item.id 賦值給 this.loadingItem，但在打完下面 change 之後的 api, this.loadingItem 就恢復空值，停止 disabled 效果

            axios.put(`${apiUrl}/v2/api/${apiPath}/cart/${item.id}`, { data }) // 此處取得的是購物車的 id
                .then((res) => {
                    console.log('更新購物車', res.data)
                    this.getCarts(); // 更新後再重新取得購物車內品項資訊
                    this.loadingItem = '';
                })
        },

        // 刪除購物車品項
        deleteCartItem(item) {

            this.loadingItem = item.id; // this.loadingItem 原為空值，當點擊 x 按鈕後，將 item.id 賦值給 this.loadingItem，但在打完下面 delete 之後的 api, this.loadingItem 就恢復空值，停止 disabled 效果

            axios.delete(`${apiUrl}/v2/api/${apiPath}/cart/${item.id}`)
                .then((res) => {
                    // 此處要取得購物車的 id
                    console.log('刪除購物車品項', res.data)
                    this.getCarts(); // 刪除後再重新取得購物車內品項資訊
                    this.loadingItem = '';
                })
        },

        onSubmit(){
            console.log('onSubmit')
        }

    },
    components: {
        productModal
    },
    mounted() {
        this.getProducts();
        this.getCarts(); // 一載入就要取得「加入到購物車中的品項」
    }
});

// 表單驗證：VeeValidate
app.component('VForm', VeeValidate.Form);
app.component('VField', VeeValidate.Field);
app.component('ErrorMessage', VeeValidate.ErrorMessage);


app.mount('#app')