import {
  capitalize,
  createID,
  setCheckedByIndex,
  setCheckedById,
} from "@/common/helpers";
import { cloneDeep } from "lodash";
import {
  SET_DATA,
  UPDATE_DOUGHS,
  UPDATE_SIZES,
  UPDATE_SAUCES,
  UPDATE_TITLE,
  UPDATE_ENTITY,
} from "@/store/mutations-types";
import { PIZZA_SIZES_ENUM } from "@/common/constants";

const entity = "builder";
const module = capitalize(entity);
const namespace = { entity, module };

export default {
  namespaced: true,
  state: {
    id: 1,
    title: "",
    quantity: 1,
    doughs: [],
    ingredients: [],
    sauces: [],
    sizes: [],
  },

  getters: {
    isFillState(state) {
      return (
        state.sizes.length > 0 &&
        state.doughs.length > 0 &&
        state.sauces.length > 0
      );
    },
    ingredientsInPizza(state) {
      return state.ingredients.filter((it) => it.quantity > 0).map(cloneDeep);
    },
    price(state, getters) {
      if (getters.isFillState) {
        const multiplier = state.sizes.find((it) => it.checked).multiplier;
        const dough = state.doughs.find((it) => it.checked).price;
        const sauce = state.sauces.find((it) => it.checked).price;
        const ingredients = getters.ingredientsInPizza.map(
          (it) => it.quantity * it.price
        );
        const sum =
          ingredients.length > 0
            ? ingredients.reduce((total, i) => total + i)
            : 0;
        return multiplier * (dough + sauce + sum);
      }
      return 0;
    },
    canCook(state, getters) {
      return state.title.length > 0 && getters.ingredientsInPizza.length > 0;
    },
  },

  actions: {
    async getAllData({ commit }) {
      const allData = await Promise.all([
        this.$api.sizes.query(),
        this.$api.dough.query(),
        this.$api.sauces.query(),
        this.$api.ingredients.query(),
      ]);

      const data = {
        id: createID(),
        title: "",
        quantity: 1,
        sizes: allData[0].map((it, i) => {
          let clItem = cloneDeep(it);
          clItem.class = PIZZA_SIZES_ENUM[clItem.multiplier];
          clItem.checked = i === 0;
          return clItem;
        }),
        doughs: allData[1].map((it, i) => {
          let clItem = cloneDeep(it);
          clItem.value = clItem.image.substring(18);
          clItem.value = clItem.value.substring(0, clItem.value.length - 4);
          clItem.checked = i === 0;
          return clItem;
        }),
        sauces: allData[2].map((it, i) => {
          let clItem = cloneDeep(it);
          clItem.checked = i === 0;
          return clItem;
        }),
        ingredients: allData[3].map((it) => {
          let clItem = cloneDeep(it);
          clItem.value = clItem.image.substring(20);
          clItem.value = clItem.value.substring(0, clItem.value.length - 4);
          clItem.quantity = 0;
          return clItem;
        }),
      };
      commit(
        SET_DATA,
        {
          ...namespace,
          value: data,
        },
        { root: true }
      );
    },

    addIngredient({ state, commit }, ingredient) {
      let item = cloneDeep(
        state.ingredients.find((it) => it.id === ingredient.id)
      );
      if (item.quantity < 3) {
        item.quantity++;
      }
      commit(
        UPDATE_ENTITY,
        {
          ...namespace,
          entity: "ingredients",
          value: item,
        },
        { root: true }
      );
    },

    updateIngredient({ state, commit }, { index, value }) {
      let item = cloneDeep(state.ingredients[index]);
      item.quantity = item.quantity + value;
      commit(
        UPDATE_ENTITY,
        {
          ...namespace,
          entity: "ingredients",
          value: item,
        },
        { root: true }
      );
    },

    updateTitle({ commit }, title) {
      commit(UPDATE_TITLE, title);
    },

    clearPizza({ state, commit }) {
      const data = {
        id: createID(),
        title: "",
        quantity: 1,
        sizes: setCheckedByIndex(state.sizes, 0),
        doughs: setCheckedByIndex(state.doughs, 0),
        sauces: setCheckedByIndex(state.sauces, 0),
        ingredients: state.ingredients.map((it) => {
          let clItem = cloneDeep(it);
          clItem.quantity = 0;
          return clItem;
        }),
      };

      commit(
        SET_DATA,
        {
          ...namespace,
          value: data,
        },
        { root: true }
      );
    },

    editPizza({ commit, state }, pizza) {
      const data = {
        id: pizza.id,
        quantity: pizza.quantity,
        title: pizza.name,
        sizes: setCheckedById(state.sizes, pizza.sizeId),
        doughs: setCheckedById(state.doughs, pizza.doughId),
        sauces: setCheckedById(state.sauces, pizza.sauceId),
        ingredients: state.ingredients.map((ing) => {
          let clItem = cloneDeep(ing);
          const ingredient = pizza.ingredients.find(
            (it) => it.ingredientId === ing.id
          );
          clItem.quantity =
            typeof ingredient !== "undefined" ? ingredient.quantity : 0;
          return clItem;
        }),
      };

      commit(
        SET_DATA,
        {
          ...namespace,
          value: data,
        },
        { root: true }
      );
    },

    changeDough({ state, commit }, index) {
      commit(UPDATE_DOUGHS, setCheckedByIndex(state.doughs, index));
    },

    changeSize({ state, commit }, index) {
      commit(UPDATE_SIZES, setCheckedByIndex(state.sizes, index));
    },

    changeSauce({ state, commit }, index) {
      commit(UPDATE_SAUCES, setCheckedByIndex(state.sauces, index));
    },

    getPizza({ state, getters }) {
      const sauce = state.sauces.find((it) => it.checked);
      const dough = state.doughs.find((it) => it.checked);
      const size = state.sizes.find((it) => it.checked);

      return {
        id: state.id,
        name: state.title,
        ingredients: getters.ingredientsInPizza.map((it) => {
          return {
            ingredientId: it.id,
            quantity: it.quantity,
          };
        }),
        doughId: dough.id,
        sauceId: sauce.id,
        sizeId: size.id,
        quantity: state.quantity,
        price: getters.price,
      };
    },
  },

  mutations: {
    [UPDATE_TITLE](state, title) {
      state.title = title;
    },
    [UPDATE_DOUGHS](state, items) {
      state.doughs = items;
    },
    [UPDATE_SIZES](state, items) {
      state.sizes = items;
    },
    [UPDATE_SAUCES](state, items) {
      state.sauces = items;
    },
  },
};
