import { capitalize } from "@/common/helpers";
import { cloneDeep } from "lodash";
import {
  SET_ENTITY,
  ADD_ENTITY,
  UPDATE_ENTITY,
  DELETE_ENTITY,
} from "@/store/mutations-types";

const entity = "orders";
const module = capitalize(entity);
const namespace = { entity, module };

export default {
  namespaced: true,
  state: {
    orders: [],
  },
  actions: {
    async getOrders({ commit }) {
      const orders = await this.$api.orders.query();
      const data = orders.map((it) => cloneDeep(it));

      commit(
        SET_ENTITY,
        {
          ...namespace,
          entity: "orders",
          value: data,
        },
        { root: true }
      );
    },

    async addOrder({ commit }, order) {
      const item = cloneDeep(order);

      const entity = await this.$api.orders.post(item);
      item.id = entity.id;
      commit(
        ADD_ENTITY,
        {
          ...namespace,
          entity: "orders",
          value: item,
        },
        { root: true }
      );
    },

    async editOrder({ commit }, order) {
      const item = cloneDeep(order);
      commit(
        UPDATE_ENTITY,
        {
          ...namespace,
          entity: "orders",
          value: item,
        },
        { root: true }
      );
    },

    async cloneOrder({ commit }, order) {
      const item = cloneDeep(order);
      const cloneOrder = {
        userId: item.userId,
        phone: item.phone,
        pizzas: item.orderPizzas.map((it) => {
          return {
            name: it.name,
            sauceId: it.sauceId,
            doughId: it.doughId,
            sizeId: it.sizeId,
            quantity: it.quantity,
            ingredients: it.ingredients.map((ing) => {
              return {
                ingredientId: ing.ingredientId,
                quantity: ing.quantity,
              };
            }),
          };
        }),
      };

      if (order.addressId) {
        cloneOrder.address = {
          id: item.orderAddress.id,
        };
      }

      if (item.orderMisc) {
        cloneOrder.misc = item.orderMisc.map((it) => {
          return {
            miscId: it.id,
            quantity: it.quantity,
          };
        });
      }

      const entity = await this.$api.orders.post(cloneOrder);
      item.id = entity.id;
      commit(
        ADD_ENTITY,
        {
          ...namespace,
          entity: "orders",
          value: item,
        },
        { root: true }
      );
    },

    async deleteOrder({ commit }, id) {
      await this.$api.orders.delete(id);
      commit(
        DELETE_ENTITY,
        {
          ...namespace,
          entity: "orders",
          id,
        },
        { root: true }
      );
    },
  },
};
