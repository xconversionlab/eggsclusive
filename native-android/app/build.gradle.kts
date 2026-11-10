plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("org.jetbrains.kotlin.plugin.compose")
}

android {
    namespace = "com.xconversionlab.spencersenterprices"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.xconversionlab.spencersenterprices"
        minSdk = 26
        targetSdk = 35
        versionCode = 2
        versionName = "1.0.0"
    }

    buildFeatures { compose = true }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation(platform("androidx.compose:compose-bom:2024.12.01"))
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.activity:activity-compose:1.10.0")
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.compose.material:material-icons-extended")
    debugImplementation("androidx.compose.ui:ui-tooling")
}

// Copy the exact same original mark used by the customer web brand to the native
// Android drawable before resource compilation. This keeps the screen logo and
// launcher icon visually identical without redrawing it.
val copyOriginalSpencersLogo by tasks.registering(Copy::class) {
    from(rootProject.file("../public/spencers-mark.webp"))
    into(layout.projectDirectory.dir("src/main/res/drawable-nodpi"))
    rename { "spencers_mark.webp" }
}

tasks.matching { it.name == "preBuild" }.configureEach {
    dependsOn(copyOriginalSpencersLogo)
}
