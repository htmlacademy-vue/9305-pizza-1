import { dough, ingredients, sauces, sizes } from "@/static/pizza.json";
import { capitalize } from "@/common/helpers";
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
    title: "",
    doughs: [],
    ingredients: [],
    sauces: [],
    sizes: [],
  },

  getters: {
    foundation(state) {
      if (state.doughs.length > 0 && state.sauces.length > 0) {
        return (
          "pizza--foundation--" +
          (state.doughs.find((f) => f.checked).value === "light"
            ? "small"
            : "big") +
          "-" +
          (state.sauces.find((f) => f.checked).id === 1 ? "tomato" : "creamy")
        );
      } else return "pizza--foundation--small-tomato";
    },
    ingredients(state, getters) {
      if (state.ingredients.length > 0) {
        return getters.ingredientsInPizza.map((m) => {
          let clItem = cloneDeep(m);
          let css = "pizza__filling--" + clItem.value;
          switch (clItem.count) {
            case 2:
              return css + " pizza__filling--second";
            case 3:
              return css + " pizza__filling--third";
            default:
              return css;
          }
        });
      }
      return [];
    },
    ingredientsInPizza(state) {
      return state.ingredients
        .filter((f) => f.count > 0)
        .map((m) => cloneDeep(m));
    },
    price(state, getters) {
      if (
        state.sizes.length > 0 &&
        state.doughs.length > 0 &&
        state.sauces.length > 0
      ) {
        let multiplier = state.sizes.find((f) => f.checked).multiplier;
        let dough = state.doughs.find((f) => f.checked).price;
        let sauces = state.sauces.find((f) => f.checked).price;
        let ingredients = getters.ingredientsInPizza.map(
          (m) => m.count * m.price
        );
        const sum =
          ingredients.length > 0
            ? ingredients.reduce((total, i) => total + i)
            : 0;
        return multiplier * (dough + sauces + sum);
      }
      return 0;
    },
    canCook(state, getters) {
      return state.title.length > 0 && getters.ingredientsInPizza.length > 0;
    },
  },

  actions: {
    query({ commit }) {
      // TODO: Add api call
      const data = {
        title: "",
        sizes: sizes.map((m, i) => {
          let clItem = cloneDeep(m);
          clItem.class = PIZZA_SIZES_ENUM[clItem.multiplier];
          clItem.checked = i === 0;
          return clItem;
        }),
        doughs: dough.map((m, i) => {
          let clItem = cloneDeep(m);
          clItem.value = clItem.image.substring(18);
          clItem.value = clItem.value.substring(0, clItem.value.length - 4);
          clItem.checked = i === 0;
          return clItem;
        }),
        sauces: sauces.map((m, i) => {
          let clItem = cloneDeep(m);
          clItem.checked = i === 0;
          return clItem;
        }),
        ingredients: ingredients.map((m) => {
          let clItem = cloneDeep(m);
          clItem.value = clItem.image.substring(20);
          clItem.value = clItem.value.substring(0, clItem.value.length - 4);
          clItem.count = 0;
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
        state.ingredients.find((f) => f.id === ingredient.id)
      );
      if (item.count < 3) {
        item.count++;
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
      item.count = item.count + value;
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

    changeDough({ state, commit }, index) {
      let items = cloneDeep(state.doughs);
      for (let i = 0; i < items.length; i++) {
        items[i].checked = i === index;
      }
      commit(UPDATE_DOUGHS, items);
    },

    changeSize({ state, commit }, index) {
      let items = cloneDeep(state.sizes);
      for (let i = 0; i < items.length; i++) {
        items[i].checked = i === index;
      }
      commit(UPDATE_SIZES, items);
    },

    changeSauce({ state, commit }, index) {
      let items = cloneDeep(state.sauces);
      for (let i = 0; i < items.length; i++) {
        items[i].checked = i === index;
      }
      commit(UPDATE_SAUCES, items);
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
