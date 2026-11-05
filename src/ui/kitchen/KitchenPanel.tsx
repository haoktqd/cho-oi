import React from 'react';
import { GameSaveState, ProcessedRecipeId } from '../../types';
import { PRODUCTS, RECIPES } from '../../economy/catalog';
import { getTotalQuantityByProduct } from '../../economy/inventory';

interface KitchenPanelProps {
  state: GameSaveState;
  onCookRecipe: (recipeId: ProcessedRecipeId) => void;
  onSellDish: (recipeId: ProcessedRecipeId) => void;
}

export function KitchenPanel({ state, onCookRecipe, onSellDish }: KitchenPanelProps) {
  const recipeIds: ProcessedRecipeId[] = [
    'soup_tomato_egg',
    'stir_fried_greens',
    'braised_fish',
    'comfort_rice_set',
  ];

  return (
    <div className="kitchen-view">
      <div className="kitchen-header">
        <div>
          <h3>Bếp Ẩm Thực & Chế Biến Gia Tăng Giá Trị</h3>
          <p className="subtext">
            Chế biến nông sản tươi sống thành các món ăn chợ trứ danh để thu về biên lợi nhuận cao vượt bậc!
          </p>
        </div>
      </div>

      <div className="recipes-grid">
        {recipeIds.map((rId) => {
          const recipe = RECIPES[rId];
          const isUnlocked = state.playerRankLevel >= recipe.unlockedAtRank;
          const finishedCount = state.processedGoods[rId] || 0;

          // Check ingredient availability
          let canCook = isUnlocked && state.cash >= recipe.laborCost;
          const ingredientStatus = recipe.ingredients.map((ing) => {
            const owned = getTotalQuantityByProduct(state.inventory, ing.productId);
            const satisfied = owned >= ing.quantity;
            if (!satisfied) canCook = false;
            return {
              ...ing,
              owned,
              satisfied,
            };
          });

          return (
            <div className={`recipe-card-lg ${!isUnlocked ? 'locked' : ''}`} key={rId}>
              <div className="recipe-card-top">
                <span className="recipe-emoji-big">{recipe.emoji}</span>
                <div>
                  <strong>{recipe.name}</strong>
                  <p className="recipe-desc">{recipe.description}</p>
                </div>
              </div>

              {/* Ingredients List */}
              <div className="ingredients-checklist">
                <span className="section-label">Nguyên liệu cần có:</span>
                <div className="ingredient-tags">
                  {ingredientStatus.map((ing) => {
                    const pDef = PRODUCTS[ing.productId];
                    return (
                      <span
                        key={ing.productId}
                        className={`ingredient-tag ${ing.satisfied ? 'ok' : 'missing'}`}
                      >
                        {pDef.emoji} {pDef.vietnameseName}: <strong>{ing.owned}</strong>/{ing.quantity}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Economic parameters */}
              <div className="recipe-economic-row">
                <div>
                  <span>Phí gia vị & công nấu:</span>
                  <strong>{recipe.laborCost} xu</strong>
                </div>
                <div>
                  <span>Giá bán món:</span>
                  <strong className="text-income">+{recipe.saleValue} xu</strong>
                </div>
              </div>

              {/* Finished Dish Stock */}
              <div className="finished-stock-bar">
                <span>Số suất có sẵn: <strong>{finishedCount} suất</strong></span>
                {finishedCount > 0 && (
                  <button
                    className="btn-sell-dish"
                    onClick={() => onSellDish(rId)}
                  >
                    Bán Ngay (+{recipe.saleValue} xu)
                  </button>
                )}
              </div>

              {/* Cook Action */}
              <div className="recipe-footer">
                {!isUnlocked ? (
                  <span className="lock-text">🔒 Yêu cầu Thương nhân Cấp {recipe.unlockedAtRank}</span>
                ) : (
                  <button
                    className="btn-cook"
                    disabled={!canCook}
                    onClick={() => onCookRecipe(rId)}
                  >
                    {canCook ? `Nấu 1 Suất (${recipe.laborCost} xu)` : 'Thiếu nguyên liệu hoặc tiền công'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
