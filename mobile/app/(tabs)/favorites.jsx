import { View, Text, Alert, ScrollView, Image, TouchableOpacity, FlatList } from 'react-native'
import { useEffect, useState } from 'react'
import { useClerk, useUser } from '@clerk/clerk-expo'
import { API_URL } from '../../constants/api'
import { favoritesStyles } from "../../assets/styles/favorites.styles";
import { COLORS } from "../../constants/colors";
import { Ionicons } from "@expo/vector-icons";
import RecipeCard from "../../components/RecipeCard";
import NoFavoritesFound from '../../components/NoFavoritesFound';
import LoadingSpinner from '../../components/LoadingSpinner';

const FavoritesScreen = () => {
  const { signOut } = useClerk();
  const { user } = useUser();
  const [favoriteRecipes, setFavoriteRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState(null);
  const toggleRating = (id) => {
    setSelectedRating((prev) => (prev === id ? null : id));
  }
  
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const response = await fetch(`${API_URL}/favorites/${user.id}`);
        if(!response.ok) throw new Error("Failed to fetch favorites");

        const favorites = await response.json();

        // transform the data to match the RecipeCard component's expected format
        const transformedFavorites = favorites.map((favorite) => ({
          ...favorite,
          id: favorite.recipeId,
        }));

        setFavoriteRecipes(transformedFavorites);
      } catch (error) {
        console.log("Error loading favorites", error);
        Alert.alert("Error", "Failed to load favorites");
      } finally {
        setLoading(false);
      }
    }

    loadFavorites();
  }, [user.id]);

  const handleSignOut = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      {"text": "Cancel", style: "cancel"},
      {"text": "Logout", style: "destructive", onPress: signOut},
    ])
  };

  if(loading) return <LoadingSpinner message='Loading your favorites...' />

  return (
    <View style={favoritesStyles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={favoritesStyles.header}>
          <Text style={favoritesStyles.title}>Favorites</Text>
          <TouchableOpacity style={favoritesStyles.logoutButton} onPress={handleSignOut}>
            <Ionicons name='log-out-outline' size={22} color={COLORS.text}/>
          </TouchableOpacity>
        </View>

        <View style={favoritesStyles.categoryFilterScrollContent}>
          <TouchableOpacity 
            style={[
              favoritesStyles.categoryButton,
              selectedRating === 1 && { borderColor: COLORS.primary, borderWidth: 2 },
            ]}
            onPress={() => toggleRating(1)}
          >
            <Image
              source={require("../../assets/images/bad.png")}
              style={favoritesStyles.categoryImage}
              contentFit="cover"
              transition={300}
            />
            <Text style={favoritesStyles.categoryText}>Nopeee</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              favoritesStyles.categoryButton,
              selectedRating === 2 && { borderColor: COLORS.primary, borderWidth: 2 },
            ]}
            onPress={() => toggleRating(2)}
          >
            <Image
              source={require("../../assets/images/ok.png")}
              style={favoritesStyles.categoryImage}
              contentFit="cover"
              transition={300}
            />
            <Text style={favoritesStyles.categoryText}>Meh</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              favoritesStyles.categoryButton,
              selectedRating === 3 && { borderColor: COLORS.primary, borderWidth: 2 },
            ]}
            onPress={() => toggleRating(3)}
          >
            <Image
              source={require("../../assets/images/good.png")}
              style={favoritesStyles.categoryImage}
              contentFit="cover"
              transition={300}
            />
            <Text style={favoritesStyles.categoryText}>Awesome</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              favoritesStyles.categoryButton,
              selectedRating === 4 && { borderColor: COLORS.primary, borderWidth: 2 },
            ]}
            onPress={() => toggleRating(4)}
          >
            <Image
              source={require("../../assets/images/tbd.png")}
              style={favoritesStyles.categoryImage}
              contentFit="cover"
              transition={300}
            />
            <Text style={favoritesStyles.categoryText}>TBD</Text>
          </TouchableOpacity>
        </View>

        <View style={favoritesStyles.recipesSection}>
          <FlatList
            data={
              selectedRating
                ? favoriteRecipes.filter((f) => f.ratingId === selectedRating)
                : favoriteRecipes
            }
            renderItem={({item}) => <RecipeCard recipe={item}/>}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            columnWrapperStyle={favoritesStyles.row}
            contentContainerStyle={favoritesStyles.recipesGrid}
            scrollEnabled={false}
            ListEmptyComponent={<NoFavoritesFound />}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default FavoritesScreen