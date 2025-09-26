// components/AmChartComponent.js
"use client"
import React, { useEffect, useRef } from "react";
import * as am5 from "@amcharts/amcharts5";
import * as am5xy from "@amcharts/amcharts5/xy";
import am5themes_Animated from "@amcharts/amcharts5/themes/Animated";
import { getChartReport } from "@/services/message";

const ChartUsage = () => {
  const chartRef = useRef(null);

  const renderChart = (data) => {
    let root = am5.Root.new(chartRef.current);
    root.setThemes([
      am5themes_Animated.new(root)
    ]);


    let chart = root.container.children.push(am5xy.XYChart.new(root, {
      panX: true,
      panY: true,
      wheelX: "panX",
      wheelY: "zoomX",
      pinchZoomX: true,
      paddingLeft: 0,
      paddingRight: 1
    }));

    // Add cursor
    // https://www.amcharts.com/docs/v5/charts/xy-chart/cursor/
    let cursor = chart.set("cursor", am5xy.XYCursor.new(root, {}));
    cursor.lineY.set("visible", false);


    // Create axes
    // https://www.amcharts.com/docs/v5/charts/xy-chart/axes/
    let xRenderer = am5xy.AxisRendererX.new(root, {
      minGridDistance: 30,
      minorGridEnabled: true
    });

    
    xRenderer.labels.template.setAll({
      rotation: 0,  // Set rotation to 0 for horizontal labels
      centerY: am5.p50,
      centerX: am5.p50,  // Adjust centering based on horizontal labels
      paddingRight: 0   // You may reduce padding as rotation is 0
    });

    xRenderer.grid.template.setAll({
      location: 1
    })

    let xAxis = chart.xAxes.push(am5xy.CategoryAxis.new(root, {
      maxDeviation: 0.3,
      categoryField: "OrganizationName",
      renderer: xRenderer,
      tooltip: am5.Tooltip.new(root, {})
    }));

    let yRenderer = am5xy.AxisRendererY.new(root, {
      strokeOpacity: 0.1
    })

    let yAxis = chart.yAxes.push(am5xy.ValueAxis.new(root, {
      maxDeviation: 0.3,
      renderer: yRenderer
    }));

    // Create series
    // https://www.amcharts.com/docs/v5/charts/xy-chart/series/
    let series = chart.series.push(am5xy.ColumnSeries.new(root, {
      name: "Dashboard Report",
      xAxis: xAxis,
      yAxis: yAxis,
      valueYField: "CountRecipient",
      sequencedInterpolation: true,
      categoryXField: "OrganizationName",
      tooltip: am5.Tooltip.new(root, {
        labelText: "{valueY}"
      })
    }));

    series.columns.template.setAll({ cornerRadiusTL: 5, cornerRadiusTR: 5, strokeOpacity: 0 });
    series.columns.template.adapters.add("fill", function (fill, target) {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    series.columns.template.adapters.add("stroke", function (stroke, target) {
      return chart.get("colors").getIndex(series.columns.indexOf(target));
    });

    if(data == null){
      data = []
    }
    xAxis.data.setAll(data);
    series.data.setAll(data);


    series.appear(1000);
    chart.appear(1000, 100);

    return () => root.dispose();
  }

  const fetchReport = async () => {
    const response = await getChartReport()
    renderChart(response.data)
  } 

  useEffect(() => {
    fetchReport()
  }, []);

  return <div id="chartdiv" ref={chartRef} style={{ width: "100%", height: "400px", fontSize: '12px' }}></div>;
};

export default ChartUsage;
