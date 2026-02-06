# ☕ Interactive Coffee Flavor Wheel
React Native와 react-native-svg를 사용하여 구현한 커피 플레이버 휠(Coffee Flavor Wheel) 데이터 시각화 프로젝트입니다. SCAA 기준의 복잡한 계층형 맛 데이터를 직관적인 원형 차트로 제공합니다.

## ✨ Key Features
- Hierarchical Visualization: 중심부(대분류)에서 외곽(소분류)으로 갈수록 세분화되는 커피의 향미 데이터를 재귀적 알고리즘으로 렌더링합니다.
- Custom SVG Geometry: polarToCartesian 변환 및 Arc Path 생성 로직을 직접 구현하여 라이브러리 의존도를 낮추고 성능을 최적화했습니다.
- Interactive UI: 각 플레이버 세그먼트 클릭 시 상세 정보를 확인할 수 있는 모달 연동 및 터치 피드백을 지원합니다.
- Adaptive Text Rendering: 각 세그먼트의 각도와 위치에 맞춰 텍스트 가독성을 위한 자동 회전(Rotation) 및 위치 계산 로직이 포함되어 있습니다.
- Dynamic Color Management: 각 맛의 고유 컬러에 맞춰 텍스트 색상을 대비 처리(getTextColor)하여 시인성을 높였습니다.

## 🛠 Tech Stack
- Framework: React Native (Expo/CLI)
- Language: TypeScript
- Graphics: react-native-svg
- Concepts: Trigonometry (Polar Coordinates), Recursive Rendering

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
    npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
