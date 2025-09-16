import { View, Text, ScrollView, TouchableOpacity, FlatList, RefreshControl } from 'react-native'
import { useEffect, useState } from 'react'
import { useRouter } from 'expo-router'
import { MealAPI } from '../../services/mealAPI'
import { homeStyles } from "../../assets/styles/home.styles";
import { Image } from "expo-image"
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import CategoryFilter from "../../components/CategoryFilter";
import RecipeCard from "../../components/RecipeCard";
import LoadingSpinner from '../../components/LoadingSpinner';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const HomeScreen = () => {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [featuredRecipe, setFeatureRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  //  Load all initial data: categories, 12 random meals, and one featured meal
  const loadData = async () => {
    try {
      setLoading(true)

      const [apiCategories, randomMeals, featuredMeal] = await Promise.all([ // 3 API endpoints in parallel
        MealAPI.getCategories(),
        MealAPI.getRandomMeals(12),
        MealAPI.getRandomMeal(),
      ]);

      const transformedCategories = apiCategories.map((cat,index) => ({
        id: index+1,
        name: cat.strCategory,
        image: cat.strCategoryThumb,
        description: cat.strCategoryDescription,
      }));

      setCategories(transformedCategories);

      // if (!selectedCategory && transformedCategories.length > 0) {
      //   const randomIndex = Math.floor(Math.random() * transformedCategories.length);
      //   setSelectedCategory(transformedCategories[randomIndex].name);
      // }

      if (!selectedCategory) setSelectedCategory(transformedCategories[0].name);

      const transformedMeals = randomMeals
        .map((meal) => MealAPI.transformMealData(meal))
        .filter((meal) => meal !== null);

      setRecipes(transformedMeals);

      const transformedFeatured = MealAPI.transformMealData(featuredMeal);
      setFeatureRecipe(transformedFeatured);
    } catch (error) {
      console.log("Error loading the data", error);
    } finally {
      setLoading(false);
    }
  };

  // Load meals based on the selected category
  const loadCategoryData = async (category) => {
    try {
      const meals = await MealAPI.filterByCategory(category); // fetches meals for that category
      const transformedMeals = meals 
        .map((meal) => MealAPI.transformMealData(meal))
        .filter((meal) => meal !== null);
      setRecipes(transformedMeals);
    } catch (error) {
      console.log("Error loading category data", error);
      setRecipes([]);
    } 
  };
  
  // Called when the user selects a category
  const handleCategorySelect = async (category) => {
    setSelectedCategory(category);
    await loadCategoryData(category);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Runs once to kick off the data fetching for the homepage
  useEffect(() => {
    loadData();
  }, []);

  if(loading && !refreshing) return <LoadingSpinner message='Loading recipes...' />

  return (
    <View style={homeStyles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        contentContainerStyle={homeStyles.scrollContent}
      >
        {/* ANIMAL ICONS */}
        <View style={homeStyles.welcomeSection}>
          <Image
            source={require("../../assets/images/lamb.png")}
            style={{width: 100, height: 100,}}
          />
          <Image
            source={require("../../assets/images/chicken.png")}
            style={{width: 100, height: 100,}}
          />
          <Image
            source={require("../../assets/images/pork.png")}
            style={{width: 100, height: 100,}}
          />
        </View>

        {/* FEATURED SECTION */}
        {featuredRecipe && <View style={homeStyles.featuredSection}>
          <TouchableOpacity
            style={homeStyles.featuredCard}
            activeOpacity={0.9}
            onPress={() => router.push(`/recipe/${featuredRecipe.id}`)}
          >
            <View style={homeStyles.featuredImageContainer}>
              <Image
                source={{ uri: featuredRecipe.image }}
                style={homeStyles.featuredImage}
                contentFit='cover'
                transition={500}
              />
              <View style={homeStyles.featuredOverlay}>
                <View style={homeStyles.featuredBadge}>
                  <Text style={homeStyles.featuredBadgeText}>Featured</Text>
                </View>

                <View style={homeStyles.featuredContent}>
                  <Text style={homeStyles.featuredTitle} numberOfLines={2}>
                    {featuredRecipe.title}
                  </Text>

                  <View style={homeStyles.featuredMeta}>
                    <View style={homeStyles.metaItem}>
                      <Ionicons name='time-outline' size={16} color={COLORS.white} />
                      <Text style={homeStyles.metaText}>{featuredRecipe.cookTime}</Text>
                    </View>
                    <View style={homeStyles.metaItem}>
                      <Ionicons name='people-outline' size={16} color={COLORS.white} />
                      <Text style={homeStyles.metaText}>{featuredRecipe.servings}</Text>
                    </View>
                    <View style={homeStyles.metaItem}>
                      <Ionicons name='location-outline' size={16} color={COLORS.white} />
                      <Text style={homeStyles.metaText}>{featuredRecipe.cookTime}</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>}

        {categories.length > 0 && (
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={handleCategorySelect}
          />
        )}

        <View style={homeStyles.recipesSection}>
          <View style={homeStyles.sectionHeader}>
            <Text style={homeStyles.sectionTitle}>{selectedCategory}</Text>
          </View>
            <FlatList
              data={recipes}
              renderItem={({ item }) => <RecipeCard recipe={item} />}
              keyExtractor={(item) => item.id.toString()} 
              numColumns={2}
              columnWrapperStyle={homeStyles.row}
              contentContainerStyle={homeStyles.recipesGrid}
              scrollEnabled={false}
              ListEmptyComponent={
                <View style={homeStyles.emptyState}>
                  <Ionicons name='restaurant-outline' size={64} color={COLORS.textLight}/>
                  <Text style={homeStyles.emptyTitle}>No recipes found</Text>
                  <Text style={homeStyles.emptyDescription}>Try a different category</Text>
                </View>
              }
            />
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;