import { View, Text, Button, TextInput, TouchableOpacity, FlatList } from 'react-native'
import { useEffect, useState } from 'react'
import { MealAPI } from '../../services/mealAPI';
import { useDebounce } from '../../hooks/useDebounce';
import { searchStyles } from "../../assets/styles/search.styles";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import RecipeCard from "../../components/RecipeCard";
import LoadingSpinner from '../../components/LoadingSpinner';

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const debouncedSearchQuery = useDebounce(searchQuery, 400);

  const performSearch = async(query) => {
    // if no search query
    if(!query.trim()) {
      const randomMeals = await MealAPI.getRandomMeal(12)
      return randomMeals
        .map((meal) => MealAPI.transformMealData(meal))
        .filter((meal) => meal !== null);
    }

    // search by name, then by ingredient if no results
    const nameResults = await MealAPI.searchMealsByName(query);
    let results = nameResults;

    if(results.length === 0) {
      const ingredientResults = await MealAPI.filterByIngredient(query);
      results = ingredientResults;
    }

    return results
      .slice(0,16)
      .map((meal) => MealAPI.transformMealData(meal))
      .filter((meal) => meal !== null);
  };

  // search with all ingredients 
  const searchAllIngredients = async (query) => {
    const ingredients = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
    if(ingredients.length === 0) return [];

    // fetch for each ingerdient
    const ingredientResult = await Promise.all(
      ingredients.map((t) => MealAPI.filterByIngredient(t))
    );

    // intersect by idMeal
    const idSets = ingredientResult.map(arr => new Set(arr.map(m => m.idMeal)));
    const commonIds = [...idSets[0]].filter(id => idSets.every(s => s.has(id)));

    // map back to meal objs (preserve one copy per id)
    const byId = new Map();
    ingredientResult.flat().forEach(m => byId.set(m.idMeal, m));
    const intersected = commonIds.map(id => byId.get(id));

    return intersected
      .slice(0, 16)
      .map((meal) => MealAPI.transformMealData(meal))
      .filter(Boolean);
  };

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const results = await performSearch("")
        setRecipes(results)
      } catch (error) {
        connsole.log("Error loading initial data", error);
      } finally {
        setInitialLoading(false);
      }
    }

    loadInitialData();
  },[]);

  useEffect(() => {
    if(initialLoading) return;

    const handleSearch = async () => {
      setLoading(true);

      try {
        const results = await performSearch(debouncedSearchQuery);
        setRecipes(results);
      } catch (error) {
        connsole.log("Error searching", error);
        setRecipes([]);
      } finally {
        setLoading(false);
      }
    };

    handleSearch();
  },[debouncedSearchQuery, initialLoading]);

  if(initialLoading) return <LoadingSpinner message='Loading...' />

  return (
    <View style={searchStyles.container}>
      {/* SEARCH BAR */}
      <View style={searchStyles.searchSection}>
        <View style={searchStyles.searchContainer}>
          <Ionicons
            name='search'
            size={20}
            color={COLORS.textLight}
            style={searchStyles.searchIcon}
          />
          <TextInput
            style={searchStyles.searchInput}
            placeholder='Search recipes, ingredients...'
            placeholderTextColor={COLORS.textLight}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType='search'
          >
          </TextInput>
          {searchQuery.length > 0 && (
            <TouchableOpacity 
              onPress={() => setSearchQuery("")} 
              style={searchStyles.clearButton}
            >
              <Ionicons name='close-circle' size={20} color={COLORS.textLight}/>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* MULTIPLE INGREDIENT SEARCH */}
      <TouchableOpacity 
        style={searchStyles.multipleIngreButton}
        onPress={async () => {
          setLoading(true);
          try {
            const res = await searchAllIngredients(searchQuery);
            setRecipes(res);
          } catch (e) {
            console.log("Error w multiple ingre search", e);
            setRecipes([]);
          } finally {
            setLoading(false);
          }
        }}
      >
        <Text style={searchStyles.multipleIngreButtonText}>Search with All Ingredients</Text>
      </TouchableOpacity>
      
      {/* SEARCH RESULT */}
      <View style={searchStyles.resultsSection}>
        <View style={searchStyles.resultsHeader}>
          <Text style={searchStyles.resultsTitle}>
            {searchQuery ? `Results for "${searchQuery}"` : "Popular Recipes"}
          </Text>
          <Text style={searchStyles.resultsCount}>{recipes.length} found</Text>
        </View>

        {loading ? (
          <View style={searchStyles.loadingContainer}>
            <LoadingSpinner message='Searching recipes...' size='small' />
          </View>
        ) : (
          <FlatList
            data={recipes}
            renderItem={({item}) => <RecipeCard recipe={item} />}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={searchStyles.row}
            contentContainerStyle={searchStyles.recipesGrid}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<NoResultFound />}
          />
        )}
      </View>
    </View>
  );
};

export default SearchScreen;

function NoResultFound() {
  return(
    <View style={searchStyles.emptyState}>
      <Ionicons name='search-outline' size={64} color={COLORS.textLight}/>
      <Text style={searchStyles.emptyTitle}>No recipes found</Text>
      <Text style={searchStyles.emptyDescription}>
        Try adjusting your search or try different keywords
      </Text>
    </View>
  );
}